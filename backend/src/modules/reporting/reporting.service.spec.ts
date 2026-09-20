import { BadRequestException } from '@nestjs/common';
import { ReportingService } from './reporting.service';

describe('ReportingService', () => {
  const prisma = {
    transaction: { findMany: jest.fn() },
    account: { findMany: jest.fn() },
    budget: { findMany: jest.fn() },
  };
  const service = new ReportingService(prisma as any);

  beforeEach(() => jest.clearAllMocks());

  it('rejects invalid summary ranges', async () => {
    await expect(service.summary('u1', 'bad', '2026-01-31')).rejects.toBeInstanceOf(BadRequestException);
    await expect(service.summary('u1', '2026-02-01', '2026-01-01')).rejects.toBeInstanceOf(BadRequestException);
  });

  it('returns summary aggregates', async () => {
    prisma.transaction.findMany.mockResolvedValue([
      {
        amount: 1000,
        type: 'INCOME',
        accountId: 'a1',
        transferToAccountId: null,
        categoryId: 'c1',
        category: { id: 'c1', name: 'Salary' },
      },
      {
        amount: 200,
        type: 'EXPENSE',
        accountId: 'a1',
        transferToAccountId: null,
        categoryId: 'c2',
        category: { id: 'c2', name: 'Groceries' },
      },
    ]);
    prisma.account.findMany.mockResolvedValue([
      {
        id: 'a1',
        name: 'Cash',
        currency: 'INR',
        openingBalance: 0,
        transactions: [],
        incomingTransfers: [],
      },
    ]);
    prisma.budget.findMany.mockResolvedValue([
      {
        categoryId: 'c2',
        amount: 500,
        category: { name: 'Groceries' },
      },
    ]);

    const summary = await service.summary('u1', '2026-08-01', '2026-08-31');
    expect(summary.income).toBe(1000);
    expect(summary.expenses).toBe(200);
    expect(summary.spendingByCategory.Groceries).toBe(200);
    expect(summary.budgetVsActual[0].remaining).toBe(300);
  });

  it('builds insights and net worth', async () => {
    prisma.transaction.findMany.mockResolvedValue([
      {
        title: 'Rent',
        merchant: 'Landlord',
        amount: 15000,
        type: 'EXPENSE',
        transactionDate: new Date('2026-08-05'),
        category: { name: 'Rent' },
      },
    ]);
    const insights = await service.insights('u1', '2026-08-15');
    expect(insights.focusMonth).toBeTruthy();
    expect(Array.isArray(insights.notices)).toBe(true);

    prisma.account.findMany.mockResolvedValue([
      {
        id: 'a1',
        name: 'Bank',
        type: 'CHECKING',
        currency: 'INR',
        openingBalance: 1000,
        createdAt: new Date('2026-01-01'),
        transactions: [],
        incomingTransfers: [],
      },
    ]);
    const worth = await service.netWorth('u1', '2026-08-15');
    expect(worth.history).toHaveLength(12);
    expect(typeof worth.netWorth).toBe('number');
  });
});
