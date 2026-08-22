import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { ListTransactionsQueryDto } from './dto/list-transactions-query.dto';
import { PrismaService } from '../../prisma/prisma.service';
import { TransactionType } from './enum/transaction-type.enum';
import { pickCategoryMemory } from './category-memory';
import { buildTransactionWhere } from './transaction-query';

const include = {
  account: true,
  category: true,
  transferToAccount: { select: { id: true, name: true } },
} satisfies Prisma.TransactionInclude;

@Injectable()
export class TransactionsService {
  constructor(private readonly prisma: PrismaService) {}

  private async assertAccount(userId: string, accountId: string) {
    const account = await this.prisma.account.findFirst({
      where: { id: accountId, userId, isArchived: false },
    });
    if (!account) {
      throw new NotFoundException('Account not found.');
    }
    return account;
  }

  private async resolveCategory(userId: string, type: TransactionType, categoryId?: string) {
    if (type === TransactionType.TRANSFER) {
      return null;
    }
    if (!categoryId) {
      throw new BadRequestException('Category is required for income and expenses.');
    }
    const category = await this.prisma.category.findFirst({
      where: { id: categoryId, userId, isArchived: false },
    });
    if (!category) {
      throw new NotFoundException('Category not found.');
    }
    if (category.type !== type) {
      throw new BadRequestException('Category type must match the transaction type.');
    }
    return category;
  }

  async create(userId: string, dto: CreateTransactionDto) {
    await this.assertAccount(userId, dto.accountId);
    if (dto.type === TransactionType.TRANSFER) {
      if (!dto.transferToAccountId) {
        throw new BadRequestException('Destination account is required for transfers.');
      }
      if (dto.transferToAccountId === dto.accountId) {
        throw new BadRequestException('Cannot transfer to the same account.');
      }
      await this.assertAccount(userId, dto.transferToAccountId);
    }
    const category = await this.resolveCategory(userId, dto.type, dto.categoryId);

    return this.prisma.transaction.create({
      data: {
        title: dto.title,
        amount: dto.amount,
        type: dto.type,
        notes: dto.notes,
        merchant: dto.merchant,
        transactionDate: new Date(dto.transactionDate),
        accountId: dto.accountId,
        categoryId: category?.id ?? null,
        transferToAccountId:
          dto.type === TransactionType.TRANSFER ? dto.transferToAccountId : null,
      },
      include,
    });
  }

  async findAll(userId: string, query: ListTransactionsQueryDto) {
    const limit = query.limit ?? 50;
    const where = buildTransactionWhere(userId, query);

    if (query.cursor) {
      const cursor = await this.prisma.transaction.findFirst({
        where: { id: query.cursor, OR: [{ account: { userId } }, { transferToAccount: { userId } }] },
      });
      if (cursor) {
        where.AND = [
          ...((where.AND as Prisma.TransactionWhereInput[]) ?? []),
          {
            OR: [
              { transactionDate: { lt: cursor.transactionDate } },
              { transactionDate: cursor.transactionDate, id: { lt: cursor.id } },
            ],
          },
        ];
      }
    }

    const items = await this.prisma.transaction.findMany({
      where,
      include,
      orderBy: [{ transactionDate: 'desc' }, { id: 'desc' }],
      take: limit + 1,
    });

    const hasMore = items.length > limit;
    const page = hasMore ? items.slice(0, limit) : items;
    return {
      items: page,
      nextCursor: hasMore ? page[page.length - 1].id : null,
    };
  }

  async findOne(userId: string, id: string) {
    const transaction = await this.prisma.transaction.findFirst({
      where: { id, account: { userId } },
      include,
    });
    if (!transaction) {
      throw new NotFoundException('Transaction not found.');
    }
    return transaction;
  }

  async update(userId: string, id: string, dto: UpdateTransactionDto) {
    const existing = await this.findOne(userId, id);
    const type = (dto.type ?? existing.type) as TransactionType;
    const accountId = dto.accountId ?? existing.accountId;

    await this.assertAccount(userId, accountId);

    let transferToAccountId = existing.transferToAccountId;
    let categoryId = existing.categoryId;

    if (type === TransactionType.TRANSFER) {
      const dest = dto.transferToAccountId ?? existing.transferToAccountId;
      if (!dest) {
        throw new BadRequestException('Destination account is required for transfers.');
      }
      if (dest === accountId) {
        throw new BadRequestException('Cannot transfer to the same account.');
      }
      await this.assertAccount(userId, dest);
      transferToAccountId = dest;
      categoryId = null;
    } else {
      transferToAccountId = null;
      const nextCategoryId = dto.categoryId ?? existing.categoryId ?? undefined;
      const category = await this.resolveCategory(userId, type, nextCategoryId);
      categoryId = category?.id ?? null;
    }

    return this.prisma.transaction.update({
      where: { id },
      data: {
        title: dto.title,
        amount: dto.amount,
        type,
        notes: dto.notes,
        merchant: dto.merchant,
        transactionDate: dto.transactionDate ? new Date(dto.transactionDate) : undefined,
        accountId,
        categoryId,
        transferToAccountId,
      },
      include,
    });
  }

  async remove(userId: string, id: string) {
    await this.findOne(userId, id);
    await this.prisma.transaction.delete({ where: { id } });
    return { success: true };
  }

  async suggestCategory(userId: string, q: string, type?: TransactionType) {
    const needle = q.trim();
    if (needle.length < 2) return null;
    const rows = await this.prisma.transaction.findMany({
      where: {
        account: { userId },
        categoryId: { not: null },
        category: { isArchived: false },
        ...(type ? { type } : { type: { not: TransactionType.TRANSFER } }),
      },
      select: {
        title: true,
        merchant: true,
        categoryId: true,
        category: { select: { id: true, name: true } },
      },
      orderBy: { transactionDate: 'desc' },
      take: 80,
    });
    const match = pickCategoryMemory(
      needle,
      rows.flatMap((row) =>
        row.category && row.categoryId
          ? [
              {
                title: row.title,
                merchant: row.merchant,
                categoryId: row.categoryId,
                categoryName: row.category.name,
              },
            ]
          : [],
      ),
    );
    if (!match) return null;
    return { categoryId: match.categoryId, categoryName: match.categoryName };
  }
}
