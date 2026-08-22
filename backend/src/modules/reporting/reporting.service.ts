import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { cashFlow, currentBalance, savingsRate } from '../../common/money/ledger';

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
}
