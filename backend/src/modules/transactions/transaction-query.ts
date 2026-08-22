import { Prisma } from '@prisma/client';
import { ListTransactionsQueryDto } from './dto/list-transactions-query.dto';

export function buildTransactionWhere(
  userId: string,
  query: ListTransactionsQueryDto,
): Prisma.TransactionWhereInput {
  const filters: Prisma.TransactionWhereInput[] = [
    {
      OR: [{ account: { userId } }, { transferToAccount: { userId } }],
    },
  ];

  if (query.accountId) {
    filters.push({
      OR: [{ accountId: query.accountId }, { transferToAccountId: query.accountId }],
    });
  }
  if (query.categoryId) filters.push({ categoryId: query.categoryId });
  if (query.type) filters.push({ type: query.type });
  if (query.from || query.to) {
    filters.push({
      transactionDate: {
        ...(query.from ? { gte: new Date(query.from) } : {}),
        ...(query.to ? { lte: new Date(query.to) } : {}),
      },
    });
  }
  if (query.search) {
    const term = query.search.trim();
    if (term) {
      filters.push({
        OR: [
          { title: { contains: term, mode: 'insensitive' } },
          { merchant: { contains: term, mode: 'insensitive' } },
          { notes: { contains: term, mode: 'insensitive' } },
          { category: { name: { contains: term, mode: 'insensitive' } } },
        ],
      });
    }
  }

  return { AND: filters };
}
