import { LedgerLoaderService } from './ledger-loader.service';

describe('LedgerLoaderService', () => {
  it('returns empty map when no accounts', async () => {
    const prisma = { transaction: { findMany: jest.fn() } };
    const service = new LedgerLoaderService(prisma as never);
    const grouped = await service.loadEntriesForAccounts('u1', []);
    expect(grouped.size).toBe(0);
    expect(prisma.transaction.findMany).not.toHaveBeenCalled();
  });

  it('groups ledger rows by account and transfer destination', async () => {
    const prisma = {
      transaction: {
        findMany: jest.fn().mockResolvedValue([
          {
            amount: 100,
            type: 'EXPENSE',
            accountId: 'a1',
            transferToAccountId: null,
            transactionDate: new Date('2026-01-02'),
          },
          {
            amount: 50,
            type: 'TRANSFER',
            accountId: 'a1',
            transferToAccountId: 'a2',
            transactionDate: new Date('2026-01-03'),
          },
        ]),
      },
    };
    const service = new LedgerLoaderService(prisma as never);
    const grouped = await service.loadEntriesForAccounts('u1', ['a1', 'a2']);
    expect(grouped.get('a1')).toHaveLength(2);
    expect(grouped.get('a2')).toHaveLength(1);
  });
});
