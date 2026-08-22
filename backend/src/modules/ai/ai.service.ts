import { Injectable, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ReportingService } from '../reporting/reporting.service';
import { TransactionsService } from '../transactions/transactions.service';
import { AccountsService } from '../accounts/accounts.service';
import { BudgetsService } from '../budgets/budgets.service';
import { PrismaService } from '../../prisma/prisma.service';
import { ChatDto } from './dto/chat.dto';
import { TransactionType } from '../transactions/enum/transaction-type.enum';

const SYSTEM_PROMPT = `You are Vridhi, a personal finance assistant for a user in India (INR unless an account says otherwise).
You help them track, understand, and manage money they have already recorded in Vridhi.

Rules:
- Use only numbers returned by tools. Never invent balances, income, expenses, or budgets.
- If tools return empty data, say the user has not recorded that information yet.
- Do not give investment, tax, or legal advice. You may explain recorded numbers and budgets.
- Transfers are not income or expenses.
- Prefer concise answers with INR formatting (e.g. ₹1,250.00).
- Mention the date range you used when summarizing.`;

const TOOLS = [
  {
    type: 'function',
    function: {
      name: 'get_financial_summary',
      description: 'Income, expenses, savings rate, spending by category, budget vs actual, and account balances for a date range.',
      parameters: {
        type: 'object',
        properties: {
          from: { type: 'string', description: 'ISO start datetime' },
          to: { type: 'string', description: 'ISO end datetime' },
        },
        required: ['from', 'to'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'list_transactions',
      description: 'List the user\'s transactions. Prefer a date range and a small limit.',
      parameters: {
        type: 'object',
        properties: {
          from: { type: 'string' },
          to: { type: 'string' },
          type: { type: 'string', enum: ['INCOME', 'EXPENSE', 'TRANSFER'] },
          limit: { type: 'number' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'list_accounts',
      description: 'List accounts with current balances.',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function',
    function: {
      name: 'list_budgets',
      description: 'List budgets for a period start date (typically the first day of a month).',
      parameters: {
        type: 'object',
        properties: { periodStart: { type: 'string' } },
        required: ['periodStart'],
      },
    },
  },
];

@Injectable()
export class AiService {
  constructor(
    private readonly config: ConfigService,
    private readonly reporting: ReportingService,
    private readonly transactions: TransactionsService,
    private readonly accounts: AccountsService,
    private readonly budgets: BudgetsService,
    private readonly prisma: PrismaService,
  ) {}

  private monthRange(date = new Date()) {
    const from = new Date(date.getFullYear(), date.getMonth(), 1);
    const to = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
    return { from: from.toISOString(), to: to.toISOString() };
  }

  private async runTool(userId: string, name: string, args: Record<string, unknown>) {
    const fallback = this.monthRange();
    switch (name) {
      case 'get_financial_summary':
        return this.reporting.summary(
          userId,
          String(args.from ?? fallback.from),
          String(args.to ?? fallback.to),
        );
      case 'list_transactions':
        return this.transactions.findAll(userId, {
          from: args.from ? String(args.from) : fallback.from,
          to: args.to ? String(args.to) : fallback.to,
          type: args.type as TransactionType | undefined,
          limit: Math.min(Number(args.limit ?? 25), 50),
        });
      case 'list_accounts':
        return this.accounts.findAll(userId);
      case 'list_budgets':
        return this.budgets.findForPeriod(userId, new Date(String(args.periodStart ?? fallback.from)));
      default:
        return { error: `Unknown tool ${name}` };
    }
  }

  async chat(userId: string, dto: ChatDto) {
    const apiKey = this.config.get<string>('OPENAI_API_KEY');
    if (!apiKey) {
      throw new ServiceUnavailableException('AI is not configured. Set OPENAI_API_KEY.');
    }

    let conversationId = dto.conversationId;
    if (conversationId) {
      const existing = await this.prisma.aiConversation.findFirst({
        where: { id: conversationId, userId },
      });
      if (!existing) {
        throw new NotFoundException('Conversation not found');
      }
    } else {
      const created = await this.prisma.aiConversation.create({
        data: {
          userId,
          title: dto.messages[0]?.content.slice(0, 80) || 'Chat',
        },
      });
      conversationId = created.id;
    }

    const lastUser = [...dto.messages].reverse().find((m) => m.role === 'user');
    if (lastUser) {
      await this.prisma.aiMessage.create({
        data: { conversationId, role: 'USER', content: lastUser.content },
      });
    }

    const model = this.config.get<string>('OPENAI_MODEL') ?? 'gpt-4o-mini';
    const messages: Array<Record<string, unknown>> = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...dto.messages.map((m) => ({ role: m.role, content: m.content })),
    ];

    let finalText = 'I could not complete that request.';
    const sources: string[] = [];
    for (let i = 0; i < 6; i += 1) {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages,
          tools: TOOLS,
          temperature: 0.2,
        }),
      });
      if (!response.ok) {
        const body = await response.text();
        throw new ServiceUnavailableException(`AI provider error: ${response.status} ${body}`);
      }
      const payload = (await response.json()) as {
        choices: Array<{
          message: {
            content?: string | null;
            tool_calls?: Array<{
              id: string;
              function: { name: string; arguments: string };
            }>;
          };
        }>;
      };
      const message = payload.choices[0]?.message;
      if (!message) break;

      if (message.tool_calls?.length) {
        messages.push(message);
        for (const call of message.tool_calls) {
          let args: Record<string, unknown> = {};
          try {
            args = JSON.parse(call.function.arguments || '{}');
          } catch {
            args = {};
          }
          const result = await this.runTool(userId, call.function.name, args);
          if (!sources.includes(call.function.name)) {
            sources.push(call.function.name);
          }
          messages.push({
            role: 'tool',
            tool_call_id: call.id,
            content: JSON.stringify(result),
          });
        }
        continue;
      }

      finalText = message.content?.trim() || finalText;
      break;
    }

    await this.prisma.aiMessage.create({
      data: { conversationId, role: 'ASSISTANT', content: finalText },
    });
    await this.prisma.aiConversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });

    return {
      conversationId,
      message: { role: 'assistant' as const, content: finalText },
      sources,
      disclaimer:
        'Vridhi explains recorded finances. It does not provide professional financial, investment, tax, or legal advice.',
    };
  }

  listConversations(userId: string) {
    return this.prisma.aiConversation.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      take: 30,
      include: { messages: { orderBy: { createdAt: 'desc' }, take: 1 } },
    });
  }

  async getConversation(userId: string, id: string) {
    const conversation = await this.prisma.aiConversation.findFirst({
      where: { id, userId },
      include: { messages: { orderBy: { createdAt: 'asc' } } },
    });
    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }
    return conversation;
  }
}
