import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { cashFlow, currentBalance, savingsRate } from '../../common/money/ledger';
import {
  buildNotices,
  cashFlowByMonth,
  detectRecurring,
  detectUnusualCategories,
  monthKey,
  type LedgerTxn,
} from '../../common/money/insights';
import { summarizeNetWorth, type DatedLedgerEntry } from '../../common/money/net-worth';

@Injectable()
export class ReportingService {
  constructor(private readonly prisma: PrismaService) {}

  async summary(userId: string, from: string, to: string) {
    const start = new Date(from);
    const end = new Date(to);
    if (Number.isNaN(start.valueOf()) || Number.isNaN(end.valueOf()) || start > end) {
      throw new BadRequestException('Provide a valid from/to date range');
    }

    const [transactions, accounts, budgets] = await Promise.all([
      this.prisma.transaction.findMany({
        where: {
          account: { userId },
          transactionDate: { gte: start, lte: end },
        },
        select: {
          amount: true,
          type: true,
          accountId: true,
          transferToAccountId: true,
          categoryId: true,
          category: { select: { id: true, name: true } },
        },
      }),
      this.prisma.account.findMany({
        where: { userId, isArchived: false },
        include: {
          transactions: {
            select: { amount: true, type: true, accountId: true, transferToAccountId: true },
          },
          incomingTransfers: {
            select: { amount: true, type: true, accountId: true, transferToAccountId: true },
          },
        },
      }),
      this.prisma.budget.findMany({
        where: {
          userId,
          periodStart: { lte: end },
          periodEnd: { gte: start },
        },
        include: { category: true },
      }),
    ]);

    const { income, expenses } = cashFlow(transactions);
    const byCategory: Record<string, number> = {};
    const spentByCategoryId: Record<string, number> = {};
    for (const transaction of transactions) {
      if (transaction.type !== 'EXPENSE') continue;
      const amount = Number(transaction.amount);
      const name = transaction.category?.name ?? 'Uncategorized';
      byCategory[name] = (byCategory[name] ?? 0) + amount;
      if (transaction.categoryId) {
        spentByCategoryId[transaction.categoryId] =
          (spentByCategoryId[transaction.categoryId] ?? 0) + amount;
      }
    }

    const budgetVsActual = budgets.map((budget) => {
      const spent = spentByCategoryId[budget.categoryId] ?? 0;
      const planned = Number(budget.amount);
      return {
        categoryId: budget.categoryId,
        categoryName: budget.category.name,
        planned,
        spent,
        remaining: planned - spent,
        utilization: planned ? spent / planned : 0,
      };
    });

    const balances = accounts.map((account) => ({
      accountId: account.id,
      name: account.name,
      currency: account.currency,
      balance: currentBalance(
        Number(account.openingBalance),
        [...account.transactions, ...account.incomingTransfers],
        account.id,
      ),
    }));

    return {
      from: start,
      to: end,
      income,
      expenses,
      netCashFlow: income - expenses,
      savingsRate: savingsRate(income, expenses),
      spendingByCategory: byCategory,
      budgetVsActual,
      balances,
    };
  }

  async insights(userId: string, asOf?: string) {
    const focus = asOf ? new Date(asOf) : new Date();
    if (Number.isNaN(focus.valueOf())) {
      throw new BadRequestException('Provide a valid asOf date');
    }
    const windowStart = new Date(focus.getFullYear(), focus.getMonth() - 11, 1);
    const windowEnd = new Date(focus.getFullYear(), focus.getMonth() + 1, 0, 23, 59, 59, 999);
    const rows = await this.prisma.transaction.findMany({
      where: {
        account: { userId },
        transactionDate: { gte: windowStart, lte: windowEnd },
      },
      select: {
        title: true,
        merchant: true,
        amount: true,
        type: true,
        transactionDate: true,
        category: { select: { name: true } },
      },
    });
    const transactions: LedgerTxn[] = rows.map((row) => ({
      title: row.title,
      merchant: row.merchant,
      amount: Number(row.amount),
      type: row.type,
      categoryName: row.category?.name ?? null,
      transactionDate: row.transactionDate,
    }));
    const focusMonth = monthKey(focus);
    const recurring = detectRecurring(transactions);
    const unusual = detectUnusualCategories(transactions, focusMonth);
    const savingsRateByMonth = cashFlowByMonth(transactions);
    const notices = buildNotices({ focusMonth, recurring, unusual, savingsRateByMonth });
    return {
      asOf: focus,
      focusMonth,
      notices,
      recurring,
      unusualCategories: unusual,
      savingsRateByMonth,
    };
  }

  async netWorth(userId: string, asOf?: string) {
    const focus = asOf ? new Date(asOf) : new Date();
    if (Number.isNaN(focus.valueOf())) {
      throw new BadRequestException('Provide a valid asOf date');
    }
    const accounts = await this.prisma.account.findMany({
      where: { userId, isArchived: false },
      include: {
        transactions: {
          select: {
            amount: true,
            type: true,
            accountId: true,
            transferToAccountId: true,
            transactionDate: true,
          },
        },
        incomingTransfers: {
          select: {
            amount: true,
            type: true,
            accountId: true,
            transferToAccountId: true,
            transactionDate: true,
          },
        },
      },
    });
    const mapped = accounts.map((account) => ({
      id: account.id,
      name: account.name,
      type: account.type,
      currency: account.currency,
      openingBalance: account.openingBalance,
      createdAt: account.createdAt,
      entries: [...account.transactions, ...account.incomingTransfers] as DatedLedgerEntry[],
    }));
    const current = summarizeNetWorth(mapped, focus);
    const history: Array<{ month: string; assets: number; liabilities: number; netWorth: number }> = [];
    for (let offset = 11; offset >= 0; offset -= 1) {
      const end = new Date(focus.getFullYear(), focus.getMonth() - offset + 1, 0, 23, 59, 59, 999);
      const snap = summarizeNetWorth(mapped, end);
      history.push({
        month: monthKey(end),
        assets: snap.assets,
        liabilities: snap.liabilities,
        netWorth: snap.netWorth,
      });
    }
    return {
      asOf: focus,
      assets: current.assets,
      liabilities: current.liabilities,
      netWorth: current.netWorth,
      byAccount: current.byAccount,
      history,
    };
  }
}
