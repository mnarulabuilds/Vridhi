import { NotFoundException } from '@nestjs/common';
import { AiService } from './ai.service';

describe('AiService', () => {
  const config = {
    get: jest.fn((key: string) => {
      if (key === 'AI_PROVIDER') return 'openai';
      if (key === 'OPENAI_API_KEY') return '';
      return undefined;
    }),
  };
  const reporting = {
    summary: jest.fn(),
    insights: jest.fn(),
    netWorth: jest.fn(),
  };
  const transactions = { findAll: jest.fn() };
  const accounts = { findAll: jest.fn() };
  const budgets = { findForPeriod: jest.fn() };
  const portfolio = {
    summary: jest.fn().mockResolvedValue({
      marketValue: 2000,
      invested: 1500,
      gain: 500,
      gainPercent: 0.33,
      allocation: { EQUITY: 2000 },
    }),
  };
  const prisma = {
    user: { findUnique: jest.fn().mockResolvedValue({ preferredCurrency: 'INR' }) },
    aiConversation: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    aiMessage: { create: jest.fn() },
  };

  const service = new AiService(
    config as any,
    reporting as any,
    transactions as any,
    accounts as any,
    budgets as any,
    portfolio as any,
    prisma as any,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.user.findUnique.mockResolvedValue({ preferredCurrency: 'INR' });
    prisma.aiConversation.create.mockResolvedValue({ id: 'conv-1' });
    prisma.aiMessage.create.mockResolvedValue({});
    prisma.aiConversation.update.mockResolvedValue({});
    reporting.summary.mockResolvedValue({
      income: 1000,
      expenses: 400,
      netCashFlow: 600,
      savingsRate: 0.6,
      spendingByCategory: { Groceries: 200 },
      budgetVsActual: [],
      balances: [{ name: 'Cash', balance: 500, currency: 'INR' }],
    });
    reporting.insights.mockResolvedValue({
      notices: [{ title: 'Recurring', detail: 'Rent repeats' }],
    });
    reporting.netWorth.mockResolvedValue({
      assets: 1000,
      liabilities: 0,
      netWorth: 1000,
      byAccount: [],
      history: [],
    });
    transactions.findAll.mockResolvedValue({ items: [], nextCursor: null });
    budgets.findForPeriod.mockResolvedValue([]);
  });

  it('answers structured summary questions without an LLM', async () => {
    const res = await service.chat('u1', {
      messages: [{ role: 'user', content: 'How much did I spend this month?' }],
    });
    expect(res.mode).toBe('template');
    expect(res.conversationId).toBe('conv-1');
    expect(res.message.content).toMatch(/spend|expense|₹/i);
    expect(reporting.summary).toHaveBeenCalled();
  });

  it('falls back when intent is unknown and no model is configured', async () => {
    const res = await service.chat('u1', {
      messages: [{ role: 'user', content: 'Can I afford a car next year?' }],
    });
    expect(res.mode).toBe('fallback');
  });

  it('lists conversations', async () => {
    prisma.aiConversation.findMany.mockResolvedValue([{ id: 'c1' }]);
    await expect(service.listConversations('u1')).resolves.toEqual([{ id: 'c1' }]);
  });

  it('loads a conversation or throws', async () => {
    prisma.aiConversation.findFirst.mockResolvedValue(null);
    await expect(service.getConversation('u1', 'missing')).rejects.toBeInstanceOf(NotFoundException);
    prisma.aiConversation.findFirst.mockResolvedValue({ id: 'c1', messages: [] });
    await expect(service.getConversation('u1', 'c1')).resolves.toEqual({ id: 'c1', messages: [] });
  });

  it('rejects foreign conversation ids', async () => {
    prisma.aiConversation.findFirst.mockResolvedValue(null);
    await expect(
      service.chat('u1', {
        conversationId: 'other-users-conv',
        messages: [{ role: 'user', content: 'How much did I spend this month?' }],
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('covers other template intents', async () => {
    const cases = [
      'Am I over budget?',
      "What's my net worth?",
      'What bills repeat?',
      'Show recent transactions',
      'How much did I spend on groceries this month?',
      'How is my investment portfolio doing?',
    ];
    for (const content of cases) {
      const res = await service.chat('u1', { messages: [{ role: 'user', content }] });
      expect(res.mode).toBe('template');
    }
  });
});
