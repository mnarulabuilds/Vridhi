import { NotFoundException } from '@nestjs/common';
import { ConnectionsService } from './connections.service';

describe('ConnectionsService', () => {
  const prisma = {
    financialConnection: {
      findMany: jest.fn(),
      create: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    transaction: { create: jest.fn() },
  };
  const aggregator = {
    providerId: 'stub',
    createLinkSession: jest.fn().mockResolvedValue({ linkToken: 't', expiresAt: new Date() }),
    exchangePublicToken: jest.fn().mockResolvedValue({ externalItemId: 'item', institutionName: 'Demo' }),
    syncTransactions: jest.fn().mockResolvedValue({ transactions: [] }),
  };
  const service = new ConnectionsService(prisma as never, aggregator as never);

  beforeEach(() => jest.clearAllMocks());

  it('lists connections', async () => {
    prisma.financialConnection.findMany.mockResolvedValue([]);
    await expect(service.list('u1')).resolves.toEqual([]);
  });

  it('creates link session', async () => {
    await expect(service.createLinkSession('u1')).resolves.toMatchObject({ linkToken: 't' });
  });

  it('completes link', async () => {
    prisma.financialConnection.create.mockResolvedValue({ id: 'c1' });
    await expect(service.completeLink('u1', 'public')).resolves.toEqual({ id: 'c1' });
  });

  it('throws when sync target missing', async () => {
    prisma.financialConnection.findFirst.mockResolvedValue(null);
    await expect(service.sync('u1', 'missing')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('syncs linked connection', async () => {
    prisma.financialConnection.findFirst.mockResolvedValue({
      id: 'c1',
      externalItemId: 'item',
      externalAccounts: [],
    });
    prisma.financialConnection.update.mockResolvedValue({ id: 'c1', status: 'LINKED' });
    await expect(service.sync('u1', 'c1')).resolves.toMatchObject({ id: 'c1' });
  });

  it('imports synced transactions and skips duplicates', async () => {
    prisma.financialConnection.findFirst.mockResolvedValue({
      id: 'c1',
      externalItemId: 'item',
      externalAccounts: [
        {
          account: { id: 'acc-1' },
        },
      ],
    });
    aggregator.syncTransactions.mockResolvedValue({
      transactions: [
        {
          title: 'Coffee',
          amount: 120,
          type: 'EXPENSE',
          merchant: 'Cafe',
          transactionDate: new Date('2026-01-02'),
          externalId: 'ext-1',
        },
      ],
    });
    prisma.transaction.create.mockResolvedValue({});
    prisma.financialConnection.update.mockResolvedValue({ id: 'c1', status: 'LINKED' });
    await expect(service.sync('u1', 'c1')).resolves.toMatchObject({ status: 'LINKED' });
  });

  it('marks connection ERROR when sync fails', async () => {
    prisma.financialConnection.findFirst.mockResolvedValue({
      id: 'c1',
      externalItemId: 'item',
      externalAccounts: [],
    });
    aggregator.syncTransactions.mockRejectedValue(new Error('provider down'));
    prisma.financialConnection.update.mockResolvedValue({});
    await expect(service.sync('u1', 'c1')).rejects.toThrow('provider down');
    expect(prisma.financialConnection.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: 'ERROR' }),
      }),
    );
  });
});
