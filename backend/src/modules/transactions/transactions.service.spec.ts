import { BadRequestException, NotFoundException } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { TransactionType } from './enum/transaction-type.enum';

describe('TransactionsService', () => {
  const prisma = {
    account: { findFirst: jest.fn() },
    category: { findFirst: jest.fn() },
    transaction: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };
  const service = new TransactionsService(prisma as any);

  beforeEach(() => jest.clearAllMocks());

  it('requires a valid account', async () => {
    prisma.account.findFirst.mockResolvedValue(null);
    await expect(
      service.create('u1', {
        title: 'Coffee',
        amount: 10,
        type: TransactionType.EXPENSE,
        categoryId: 'c1',
        transactionDate: '2026-08-01',
        accountId: 'missing',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('requires category for expenses', async () => {
    prisma.account.findFirst.mockResolvedValue({ id: 'a1' });
    await expect(
      service.create('u1', {
        title: 'Coffee',
        amount: 10,
        type: TransactionType.EXPENSE,
        transactionDate: '2026-08-01',
        accountId: 'a1',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('creates an expense', async () => {
    prisma.account.findFirst.mockResolvedValue({ id: 'a1' });
    prisma.category.findFirst.mockResolvedValue({ id: 'c1', type: TransactionType.EXPENSE });
    prisma.transaction.create.mockResolvedValue({ id: 't1' });
    const row = await service.create('u1', {
      title: 'Coffee',
      amount: 10,
      type: TransactionType.EXPENSE,
      categoryId: 'c1',
      transactionDate: '2026-08-01',
      accountId: 'a1',
    });
    expect(row).toEqual({ id: 't1' });
  });

  it('rejects transfer without destination', async () => {
    prisma.account.findFirst.mockResolvedValue({ id: 'a1' });
    await expect(
      service.create('u1', {
        title: 'Move',
        amount: 50,
        type: TransactionType.TRANSFER,
        transactionDate: '2026-08-01',
        accountId: 'a1',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects mismatched category type', async () => {
    prisma.account.findFirst.mockResolvedValue({ id: 'a1' });
    prisma.category.findFirst.mockResolvedValue({ id: 'c1', type: TransactionType.INCOME });
    await expect(
      service.create('u1', {
        title: 'Coffee',
        amount: 10,
        type: TransactionType.EXPENSE,
        categoryId: 'c1',
        transactionDate: '2026-08-01',
        accountId: 'a1',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('creates income with category', async () => {
    prisma.account.findFirst.mockResolvedValue({ id: 'a1' });
    prisma.category.findFirst.mockResolvedValue({ id: 'c1', type: TransactionType.INCOME });
    prisma.transaction.create.mockResolvedValue({ id: 't1' });
    await service.create('u1', {
      title: 'Salary',
      amount: 1000,
      type: TransactionType.INCOME,
      categoryId: 'c1',
      transactionDate: '2026-08-01',
      accountId: 'a1',
    });
    expect(prisma.transaction.create).toHaveBeenCalled();
  });

  it('validates transfer destinations', async () => {
    prisma.account.findFirst.mockResolvedValue({ id: 'a1' });
    await expect(
      service.create('u1', {
        title: 'Move',
        amount: 50,
        type: TransactionType.TRANSFER,
        transactionDate: '2026-08-01',
        accountId: 'a1',
        transferToAccountId: 'a1',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('finds a transaction by id', async () => {
    prisma.transaction.findFirst.mockResolvedValue({ id: 't1' });
    await expect(service.findOne('u1', 't1')).resolves.toEqual({ id: 't1' });
  });

  it('applies cursor pagination when cursor exists', async () => {
    prisma.transaction.findFirst.mockResolvedValueOnce({
      id: 'cursor',
      transactionDate: new Date('2026-08-02'),
    });
    prisma.transaction.findMany.mockResolvedValue([{ id: 't1', transactionDate: new Date('2026-08-01') }]);
    const page = await service.findAll('u1', { limit: 10, cursor: 'cursor' });
    expect(page.items).toHaveLength(1);
  });

  it('paginates list results', async () => {
    prisma.transaction.findMany.mockResolvedValue([
      { id: 't2', transactionDate: new Date('2026-08-02') },
      { id: 't1', transactionDate: new Date('2026-08-01') },
    ]);
    const page = await service.findAll('u1', { limit: 1 });
    expect(page.items).toHaveLength(1);
    expect(page.nextCursor).toBe('t2');
  });

  it('throws when transaction is missing', async () => {
    prisma.transaction.findFirst.mockResolvedValue(null);
    await expect(service.findOne('u1', 'missing')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('removes a transaction', async () => {
    prisma.transaction.findFirst.mockResolvedValue({ id: 't1', type: TransactionType.EXPENSE, accountId: 'a1' });
    prisma.transaction.delete.mockResolvedValue({});
    await expect(service.remove('u1', 't1')).resolves.toEqual({ success: true });
  });

  it('suggestCategory returns null for short queries', async () => {
    await expect(service.suggestCategory('u1', 'a')).resolves.toBeNull();
  });

  it('creates a transfer between accounts', async () => {
    prisma.account.findFirst.mockImplementation(({ where }: { where: { id: string } }) =>
      Promise.resolve({ id: where.id }),
    );
    prisma.transaction.create.mockResolvedValue({ id: 't1' });
    await service.create('u1', {
      title: 'Move',
      amount: 50,
      type: TransactionType.TRANSFER,
      transactionDate: '2026-08-01',
      accountId: 'a1',
      transferToAccountId: 'a2',
    });
    expect(prisma.transaction.create).toHaveBeenCalled();
  });

  it('updates a transfer destination', async () => {
    prisma.transaction.findFirst.mockResolvedValue({
      id: 't1',
      type: TransactionType.TRANSFER,
      accountId: 'a1',
      transferToAccountId: 'a2',
      categoryId: null,
    });
    prisma.account.findFirst.mockImplementation(({ where }: { where: { id: string } }) =>
      Promise.resolve({ id: where.id }),
    );
    prisma.transaction.update.mockResolvedValue({ id: 't1' });
    await service.update('u1', 't1', { transferToAccountId: 'a3' });
    expect(prisma.transaction.update).toHaveBeenCalled();
  });

  it('updates an expense category', async () => {
    prisma.transaction.findFirst.mockResolvedValue({
      id: 't1',
      type: TransactionType.EXPENSE,
      accountId: 'a1',
      categoryId: 'c1',
      transferToAccountId: null,
    });
    prisma.account.findFirst.mockResolvedValue({ id: 'a1' });
    prisma.category.findFirst.mockResolvedValue({ id: 'c2', type: TransactionType.EXPENSE });
    prisma.transaction.update.mockResolvedValue({ id: 't1' });
    await service.update('u1', 't1', { categoryId: 'c2', amount: 20 });
    expect(prisma.transaction.update).toHaveBeenCalled();
  });

  it('suggests a category from history', async () => {
    prisma.transaction.findMany.mockResolvedValue([
      {
        title: 'Starbucks coffee',
        merchant: 'Starbucks',
        categoryId: 'c1',
        category: { id: 'c1', name: 'Dining' },
      },
    ]);
    await expect(service.suggestCategory('u1', 'starbucks')).resolves.toEqual({
      categoryId: 'c1',
      categoryName: 'Dining',
    });
  });
});
