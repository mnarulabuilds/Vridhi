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
    filters.push({
      OR: [
        { title: { contains: query.search, mode: 'insensitive' } },
        { merchant: { contains: query.search, mode: 'insensitive' } },
      ],
    });
  }

  return { AND: filters };
}
