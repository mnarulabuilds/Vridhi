import { Injectable, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ReportingService } from '../reporting/reporting.service';
import { TransactionsService } from '../transactions/transactions.service';
import { AccountsService } from '../accounts/accounts.service';
import { BudgetsService } from '../budgets/budgets.service';
import { PortfolioService } from '../portfolio/portfolio.service';
import { PrismaService } from '../../prisma/prisma.service';
import { ChatDto } from './dto/chat.dto';
import { TransactionType } from '../transactions/enum/transaction-type.enum';
import { classifyIntent, type ClassifiedIntent } from './intent';
import {
  createChatCompletion,
  NoFastOllamaModelError,
  prepareLlmClient,
  resolveLlmConfig,
  type LlmClientOptions,
} from './llm.client';
import {
  FALLBACK_HELP,
  renderBalances,
  renderBudgets,
  renderCategorySpend,
  renderInsights,
  renderNetWorth,
  renderPortfolio,
  renderRecent,
  renderSummary,
  type SummarySnapshot,
} from './templates';

const DISCLAIMER =
  'Vridhi explains recorded finances. It does not provide professional financial, investment, tax, or legal advice.';

const SYSTEM_PROMPT = `You are Vridhi, a personal finance assistant for a user in India (INR unless an account says otherwise).
You help them track, understand, and manage money they have already recorded in Vridhi.

Rules:
- Use only numbers returned by tools. Never invent balances, income, expenses, or budgets.
- If tools return empty data, say the user has not recorded that information yet.
- Do not give investment, tax, or legal advice. You may explain recorded numbers and budgets.
- Transfers are not income or expenses.
- Prefer concise answers with INR formatting (e.g. ₹1,250.00).
- Mention the date range you used when summarizing.
- When the user asks what changed, what is unusual, or what bills repeat, call get_insights.
- When the user asks net worth, assets, or liabilities, call get_net_worth.`;

const LOCAL_SYSTEM_PROMPT = `You are Vridhi, a personal finance assistant for India (INR unless noted).
Answer only from the ledger snapshot JSON. Never invent numbers.
If the snapshot does not contain the answer, say so and suggest a structured question (spend, budgets, net worth).
Do not give investment, tax, or legal advice. Transfers are not income or expenses.
Reply in at most 4 short sentences. Format money as ₹1,250.00.`;

const HEAVY_MODEL_HELP =
  'Open chat needs a small local model so it does not freeze this machine. Run `ollama pull llama3.2`, then ask again. Spending, net worth, budgets, and recurring bills still work from your books without a model.';

const TOOLS = [
  {
    type: 'function',
    function: {
      name: 'get_financial_summary',
      description:
        'Income, expenses, savings rate, spending by category, budget vs actual, and account balances for a date range.',
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
      description: "List the user's transactions. Prefer a date range and a small limit.",
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
  {
    type: 'function',
    function: {
      name: 'get_insights',
      description:
        'Pattern notices: recurring bills, unusual category spend vs recent months, and savings-rate trend. Pass asOf as an ISO date in the month the user is asking about.',
      parameters: {
        type: 'object',
        properties: {
          asOf: { type: 'string', description: 'ISO date in the focus month' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_net_worth',
      description:
        'Assets, liabilities, net worth, per-account contribution, and a 12-month history. Pass asOf as an ISO date.',
      parameters: {
        type: 'object',
        properties: {
          asOf: { type: 'string', description: 'ISO date to value the books on' },
        },
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
    private readonly portfolio: PortfolioService,
    private readonly prisma: PrismaService,
  ) {}

  private llmConfig() {
    return resolveLlmConfig({
      AI_PROVIDER: this.config.get<string>('AI_PROVIDER'),
      OPENAI_BASE_URL: this.config.get<string>('OPENAI_BASE_URL'),
      OPENAI_API_KEY: this.config.get<string>('OPENAI_API_KEY'),
      OPENAI_MODEL: this.config.get<string>('OPENAI_MODEL'),
    });
  }

  private isLlmConfigured() {
    const llm = this.llmConfig();
    if (llm.provider === 'ollama') return true;
    return Boolean(llm.apiKey);
  }

  private async runTool(userId: string, name: string, args: Record<string, unknown>) {
    const fallback = classifyIntent('', new Date());
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
        return this.budgets.findForPeriod(
          userId,
          new Date(String(args.periodStart ?? fallback.from)),
        );
      case 'get_insights':
        return this.reporting.insights(userId, args.asOf ? String(args.asOf) : undefined);
      case 'get_net_worth':
        return this.reporting.netWorth(userId, args.asOf ? String(args.asOf) : undefined);
      default:
        return { error: `Unknown tool ${name}` };
    }
  }

  private async currencyFor(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { preferredCurrency: true },
    });
    return user?.preferredCurrency || 'INR';
  }

  private async answerFromIntent(userId: string, intent: ClassifiedIntent) {
    const currency = await this.currencyFor(userId);
    const sources: string[] = [];

    const loadSummary = async () => {
      sources.push('get_financial_summary');
      return this.reporting.summary(userId, intent.from, intent.to) as Promise<SummarySnapshot>;
    };

    switch (intent.kind) {
      case 'summary': {
        const summary = await loadSummary();
        return { text: renderSummary(intent.periodLabel, summary, currency), sources };
      }
      case 'category_spend': {
        const summary = await loadSummary();
        return {
          text: renderCategorySpend(intent.periodLabel, summary, intent.categoryHint ?? '', currency),
          sources,
        };
      }
      case 'budgets': {
        const [summary, budgetRows] = await Promise.all([
          loadSummary(),
          this.budgets.findForPeriod(userId, new Date(intent.from)),
        ]);
        sources.push('list_budgets');
        return {
          text: renderBudgets(intent.periodLabel, budgetRows, summary, currency),
          sources,
        };
      }
      case 'balances': {
        const summary = await loadSummary();
        return { text: renderBalances([], summary, currency), sources };
      }
      case 'insights': {
        const insights = await this.reporting.insights(userId, intent.asOf);
        sources.push('get_insights');
        return { text: renderInsights(intent.periodLabel, insights.notices), sources };
      }
      case 'net_worth': {
        const report = await this.reporting.netWorth(userId, intent.to);
        sources.push('get_net_worth');
        return { text: renderNetWorth(intent.periodLabel, report, currency), sources };
      }
      case 'portfolio': {
        const report = await this.portfolio.summary(userId);
        sources.push('portfolio_summary');
        return { text: renderPortfolio(intent.periodLabel, report, currency), sources };
      }
      case 'recent': {
        const page = await this.transactions.findAll(userId, {
          from: intent.from,
          to: intent.to,
          limit: 8,
        });
        sources.push('list_transactions');
        return { text: renderRecent(intent.periodLabel, page.items, currency), sources };
      }
      default:
        return { text: FALLBACK_HELP, sources };
    }
  }

  private async ensureConversation(userId: string, dto: ChatDto) {
    if (dto.conversationId) {
      const existing = await this.prisma.aiConversation.findFirst({
        where: { id: dto.conversationId, userId },
      });
      if (!existing) {
        throw new NotFoundException('Conversation not found');
      }
      return existing.id;
    }
    const created = await this.prisma.aiConversation.create({
      data: {
        userId,
        title: dto.messages[0]?.content.slice(0, 80) || 'Chat',
      },
    });
    return created.id;
  }

  private async persistAssistant(conversationId: string, content: string) {
    await this.prisma.aiMessage.create({
      data: { conversationId, role: 'ASSISTANT', content },
    });
    await this.prisma.aiConversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });
  }

  private async ledgerSnapshot(userId: string, from: string, to: string, asOf: string) {
    const [summary, worth, insights, recent] = await Promise.all([
      this.reporting.summary(userId, from, to),
      this.reporting.netWorth(userId, to),
      this.reporting.insights(userId, asOf),
      this.transactions.findAll(userId, { from, to, limit: 8 }),
    ]);
    const spending = Object.entries(summary.spendingByCategory ?? {})
      .sort((a, b) => Number(b[1]) - Number(a[1]))
      .slice(0, 8)
      .map(([name, amount]) => ({ name, amount: Number(amount) }));
    return {
      period: { from, to },
      income: summary.income,
      expenses: summary.expenses,
      netCashFlow: summary.netCashFlow,
      savingsRate: summary.savingsRate,
      spending,
      budgets: (summary.budgetVsActual ?? []).map((row) => ({
        category: row.categoryName,
        planned: row.planned,
        spent: row.spent,
        remaining: row.remaining,
      })),
      balances: (summary.balances ?? []).map((row) => ({
        name: row.name,
        balance: row.balance,
        currency: row.currency,
      })),
      netWorth: {
        assets: worth.assets,
        liabilities: worth.liabilities,
        netWorth: worth.netWorth,
      },
      notices: (insights.notices ?? []).map((notice) => ({
        title: notice.title,
        detail: notice.detail,
      })),
      recent: recent.items.map((item) => ({
        title: item.title,
        amount: Number(item.amount),
        type: item.type,
        category: item.category?.name ?? null,
      })),
    };
  }

  private async completeLocal(userId: string, dto: ChatDto, llm: LlmClientOptions) {
    const lastUser = [...dto.messages].reverse().find((m) => m.role === 'user');
    const period = classifyIntent(lastUser?.content ?? '');
    const snapshot = await this.ledgerSnapshot(userId, period.from, period.to, period.asOf);
    const message = await createChatCompletion(llm, {
      temperature: 0.2,
      messages: [
        { role: 'system', content: LOCAL_SYSTEM_PROMPT },
        {
          role: 'user',
          content: `Ledger snapshot:\n${JSON.stringify(snapshot)}\n\nQuestion: ${lastUser?.content ?? ''}`,
        },
      ],
    });
    return {
      text: message.content?.trim() || 'I could not complete that request.',
      sources: ['get_financial_summary', 'get_net_worth', 'get_insights', 'list_transactions'],
    };
  }

  private async completeWithTools(userId: string, dto: ChatDto, llm: LlmClientOptions) {
    const messages: Array<Record<string, unknown>> = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...dto.messages.slice(-8).map((m) => ({ role: m.role, content: m.content })),
    ];

    let finalText = 'I could not complete that request.';
    const sources: string[] = [];
    for (let i = 0; i < 3; i += 1) {
      const message = await createChatCompletion(llm, {
        messages,
        tools: TOOLS,
        temperature: 0.2,
      });
      if (message.tool_calls?.length) {
        messages.push(message as Record<string, unknown>);
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
    return { text: finalText, sources };
  }

  private async completeWithLlm(userId: string, dto: ChatDto) {
    const llm = await prepareLlmClient(this.llmConfig());
    if (llm.provider === 'ollama') {
      return this.completeLocal(userId, dto, llm);
    }
    return this.completeWithTools(userId, dto, llm);
  }

  async chat(userId: string, dto: ChatDto) {
    const conversationId = await this.ensureConversation(userId, dto);
    const lastUser = [...dto.messages].reverse().find((m) => m.role === 'user');
    if (lastUser) {
      await this.prisma.aiMessage.create({
        data: { conversationId, role: 'USER', content: lastUser.content },
      });
    }

    const intent = classifyIntent(lastUser?.content ?? '');
    let mode: 'template' | 'llm' | 'fallback' = 'template';
    let text = FALLBACK_HELP;
    let sources: string[] = [];

    if (intent.kind !== 'unknown') {
      const answered = await this.answerFromIntent(userId, intent);
      text = answered.text;
      sources = answered.sources;
      mode = 'template';
    } else if (!this.isLlmConfigured()) {
      mode = 'fallback';
      text = FALLBACK_HELP;
    } else {
      try {
        const answered = await this.completeWithLlm(userId, dto);
        text = answered.text;
        sources = answered.sources;
        mode = 'llm';
      } catch (error) {
        if (error instanceof NoFastOllamaModelError) {
          mode = 'fallback';
          text = HEAVY_MODEL_HELP;
        } else {
          const llm = this.llmConfig();
          const detail = error instanceof Error ? error.message : 'unknown error';
          throw new ServiceUnavailableException(
            `Could not reach the ${llm.provider} model at ${llm.baseUrl}. ${
              llm.provider === 'ollama'
                ? 'Start Ollama (ollama serve) or pull a small model with: ollama pull llama3.2'
                : 'Check OPENAI_API_KEY, or set AI_PROVIDER=ollama to use a local model.'
            } ${detail}`,
          );
        }
      }
    }

    await this.persistAssistant(conversationId, text);
    return {
      conversationId,
      message: { role: 'assistant' as const, content: text },
      sources,
      mode,
      disclaimer: DISCLAIMER,
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
