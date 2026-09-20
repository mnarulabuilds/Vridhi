import { PortfolioService } from './portfolio.service';

describe('PortfolioService', () => {
  const prisma = {
    holding: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };
  const service = new PortfolioService(prisma as never);

  it('summarizes holdings', async () => {
    prisma.holding.findMany.mockResolvedValue([
      {
        costBasis: 1000,
        quantity: 10,
        lastPrice: 120,
        assetClass: 'EQUITY',
      },
    ]);
    const summary = await service.summary('u1');
    expect(summary.marketValue).toBe(1200);
    expect(summary.gain).toBe(200);
  });

  it('creates and deletes holdings', async () => {
    prisma.holding.create.mockResolvedValue({ id: 'h1' });
    prisma.holding.findFirst.mockResolvedValue({ id: 'h1' });
    prisma.holding.delete.mockResolvedValue({});
    await expect(
      service.upsertHolding('u1', { symbol: 'INFY', name: 'Infosys', quantity: 1, costBasis: 100 }),
    ).resolves.toEqual({ id: 'h1' });
    await expect(service.deleteHolding('u1', 'h1')).resolves.toEqual({ success: true });
  });
});
