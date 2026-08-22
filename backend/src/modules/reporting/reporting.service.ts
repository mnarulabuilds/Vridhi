import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ReportingService {
  constructor(private readonly prisma: PrismaService) {}

  async summary(userId: string, from: string, to: string) {
    const start = new Date(from);
    const end = new Date(to);
    if (Number.isNaN(start.valueOf()) || Number.isNaN(end.valueOf()) || start > end) {
      throw new BadRequestException('Provide a valid from/to date range');
    }
    const [transactions, accounts] = await Promise.all([
      this.prisma.transaction.findMany({ where: { account: { userId }, transactionDate: { gte: start, lte: end } }, select: { amount: true, type: true, category: true } }),
      this.prisma.account.findMany({ where: { userId, isArchived: false }, include: { transactions: { select: { amount: true, type: true } } } }),
    ]);
    const byCategory: Record<string, number> = {};
    let income = 0;
    let expenses = 0;
    for (const transaction of transactions) {
      const amount = Number(transaction.amount);
      if (transaction.type === 'INCOME') income += amount;
      if (transaction.type === 'EXPENSE') {
        expenses += amount;
        byCategory[transaction.category] = (byCategory[transaction.category] ?? 0) + amount;
      }
    }
    const balances = accounts.map(account => ({
      accountId: account.id,
      currency: account.currency,
      balance: Number(account.openingBalance) + account.transactions.reduce((sum, t) => sum + (t.type === 'INCOME' ? Number(t.amount) : -Number(t.amount)), 0),
    }));
    return { from: start, to: end, income, expenses, netCashFlow: income - expenses, savingsRate: income ? (income - expenses) / income : 0, spendingByCategory: byCategory, balances };
  }
}
