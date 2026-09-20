import { NotFoundException } from '@nestjs/common';
import { AccountsService } from './accounts.service';

describe('AccountsService', () => {
  const prisma = {
    account: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUniqueOrThrow: jest.fn(),
      update: jest.fn(),
    },
  };
  const service = new AccountsService(prisma as any);

  beforeEach(() => jest.clearAllMocks());

  it('creates and reloads an account with balances', async () => {
    prisma.account.create.mockResolvedValue({ id: 'a1' });
    prisma.account.findFirst.mockResolvedValue({ id: 'a1' });
    prisma.account.findUniqueOrThrow.mockResolvedValue({
      id: 'a1',
      name: 'Cash',
      type: 'CHECKING',
      openingBalance: 100,
      currency: 'INR',
      transactions: [],
      incomingTransfers: [],
    });
    const account = await service.create('u1', {
      name: 'Cash',
      type: 'CHECKING' as any,
      openingBalance: 100,
    });
    expect(account.currentBalance).toBe(100);
  });

  it('lists accounts with computed balances', async () => {
    prisma.account.findMany.mockResolvedValue([
      {
        id: 'a1',
        name: 'Cash',
        type: 'CHECKING',
        openingBalance: 0,
        currency: 'INR',
        transactions: [{ amount: 50, type: 'INCOME', accountId: 'a1', transferToAccountId: null }],
        incomingTransfers: [],
      },
    ]);
    const rows = await service.findAll('u1');
    expect(rows[0].currentBalance).toBe(50);
  });

  it('throws when account is missing', async () => {
    prisma.account.findFirst.mockResolvedValue(null);
    await expect(service.findOne('u1', 'missing')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('archives an account', async () => {
    prisma.account.findFirst.mockResolvedValue({ id: 'a1' });
    prisma.account.update.mockResolvedValue({ id: 'a1', isArchived: true });
    await service.archive('u1', 'a1');
    expect(prisma.account.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { isArchived: true } }),
    );
  });
});
