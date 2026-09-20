import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ImportsService, importHash } from './imports.service';
import { createHash } from 'crypto';

describe('importHash', () => {
  it('is stable for the same ledger identity', () => {
    const a = importHash('acct', '2026-01-01T00:00:00.000Z', 12.5, 'Coffee', 'EXPENSE');
    const b = importHash('acct', '2026-01-01T00:00:00.000Z', 12.5, 'Coffee', 'EXPENSE');
    expect(a).toBe(b);
    expect(a).toHaveLength(64);
    expect(a).toBe(
      createHash('sha256').update('acct|2026-01-01T00:00:00.000Z|12.5|Coffee|EXPENSE').digest('hex'),
    );
  });

  it('changes when amount or title changes', () => {
    const a = importHash('acct', '2026-01-01T00:00:00.000Z', 12.5, 'Coffee', 'EXPENSE');
    const b = importHash('acct', '2026-01-01T00:00:00.000Z', 12.5, 'Tea', 'EXPENSE');
    expect(a).not.toBe(b);
  });
});

describe('ImportsService', () => {
  const prisma = {
    account: { findFirst: jest.fn() },
    category: { findMany: jest.fn() },
    transaction: { create: jest.fn() },
  };
  const service = new ImportsService(prisma as any);

  beforeEach(() => jest.clearAllMocks());

  it('previews parsed records', () => {
    const preview = service.previewFromRecords([
      ['Date', 'Amount'],
      ['2026-01-01', '10'],
    ]);
    expect(preview.rowCount).toBe(1);
  });

  it('previews CSV headers and mapping', () => {
    const csv = Buffer.from('Date,Debit,Credit,Description\n2026-01-01,100,,Coffee\n');
    const preview = service.preview(csv);
    expect(preview.header).toEqual(['Date', 'Debit', 'Credit', 'Description']);
    expect(preview.suggestedMapping.date).toBe('Date');
    expect(preview.rowCount).toBe(1);
  });

  it('rejects empty CSV files', () => {
    expect(() => service.preview(Buffer.from('\n\n'))).toThrow(BadRequestException);
  });

  it('commits parsed rows', async () => {
    prisma.account.findFirst.mockResolvedValue({ id: 'a1' });
    prisma.category.findMany.mockResolvedValue([
      { id: 'inc', type: 'INCOME', name: 'Other Income' },
      { id: 'exp', type: 'EXPENSE', name: 'Other' },
    ]);
    prisma.transaction.create.mockResolvedValue({});
    const result = await service.commit('u1', {
      accountId: 'a1',
      header: ['Date', 'Debit', 'Title'],
      mapping: { date: 'Date', debit: 'Debit', title: 'Title' },
      rows: [['2026-01-01', '50', 'Snack']],
    });
    expect(result.created).toBe(1);
    expect(result.errors).toHaveLength(0);
  });

  it('skips duplicate import hashes', async () => {
    prisma.account.findFirst.mockResolvedValue({ id: 'a1' });
    prisma.category.findMany.mockResolvedValue([
      { id: 'inc', type: 'INCOME', name: 'Other Income' },
      { id: 'exp', type: 'EXPENSE', name: 'Other' },
    ]);
    prisma.transaction.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('dup', { code: 'P2002', clientVersion: 'test' }),
    );
    const result = await service.commit('u1', {
      accountId: 'a1',
      header: ['Date', 'Credit', 'Title'],
      mapping: { date: 'Date', credit: 'Credit', title: 'Title' },
      rows: [['2026-01-01', '100', 'Salary']],
    });
    expect(result.skipped).toBe(1);
  });

  it('imports income from credit column', async () => {
    prisma.account.findFirst.mockResolvedValue({ id: 'a1' });
    prisma.category.findMany.mockResolvedValue([
      { id: 'inc', type: 'INCOME', name: 'Other Income' },
      { id: 'exp', type: 'EXPENSE', name: 'Other' },
    ]);
    prisma.transaction.create.mockResolvedValue({});
    const result = await service.commit('u1', {
      accountId: 'a1',
      header: ['Date', 'Amount', 'Type', 'Title'],
      mapping: { date: 'Date', amount: 'Amount', type: 'Type', title: 'Title' },
      rows: [['2026-01-01', '-500', 'CREDIT', 'Refund']],
    });
    expect(result.created).toBe(1);
  });

  it('records row errors for invalid dates and amounts', async () => {
    prisma.account.findFirst.mockResolvedValue({ id: 'a1' });
    prisma.category.findMany.mockResolvedValue([
      { id: 'inc', type: 'INCOME', name: 'Other Income' },
      { id: 'exp', type: 'EXPENSE', name: 'Other' },
    ]);
    const result = await service.commit('u1', {
      accountId: 'a1',
      header: ['Date', 'Amount', 'Title'],
      mapping: { date: 'Date', amount: 'Amount', title: 'Title' },
      rows: [
        ['not-a-date', '10', 'Bad date'],
        ['2026-01-01', '', 'Missing amount'],
      ],
    });
    expect(result.created).toBe(0);
    expect(result.errors.length).toBe(2);
  });

  it('requires default categories', async () => {
    prisma.account.findFirst.mockResolvedValue({ id: 'a1' });
    prisma.category.findMany.mockResolvedValue([]);
    await expect(
      service.commit('u1', {
        accountId: 'a1',
        header: ['Date', 'Amount'],
        mapping: { date: 'Date', amount: 'Amount' },
        rows: [['2026-01-01', '10']],
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('requires a valid account', async () => {
    prisma.account.findFirst.mockResolvedValue(null);
    await expect(
      service.commit('u1', {
        accountId: 'missing',
        header: ['Date'],
        mapping: { date: 'Date' },
        rows: [],
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
