import { BadRequestException, NotFoundException } from '@nestjs/common';
import { BudgetsService } from './budgets.service';

describe('BudgetsService', () => {
  const prisma = {
    budget: { findMany: jest.fn(), upsert: jest.fn() },
    category: { findFirst: jest.fn() },
  };
  const service = new BudgetsService(prisma as any);

  beforeEach(() => jest.clearAllMocks());

  it('findForPeriod queries by user and period', async () => {
    prisma.budget.findMany.mockResolvedValue([]);
    await service.findForPeriod('u1', new Date('2026-08-01'));
    expect(prisma.budget.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: 'u1', periodStart: new Date('2026-08-01') } }),
    );
  });

  it('rejects invalid budget periods', async () => {
    await expect(
      service.upsert('u1', {
        categoryId: 'c1',
        amount: 100,
        periodStart: '2026-08-31',
        periodEnd: '2026-08-01',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects missing categories', async () => {
    prisma.category.findFirst.mockResolvedValue(null);
    await expect(
      service.upsert('u1', {
        categoryId: 'c1',
        amount: 100,
        periodStart: '2026-08-01',
        periodEnd: '2026-08-31',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('upserts a budget', async () => {
    prisma.category.findFirst.mockResolvedValue({ id: 'c1' });
    prisma.budget.upsert.mockResolvedValue({ id: 'b1' });
    const row = await service.upsert('u1', {
      categoryId: 'c1',
      amount: 500,
      periodStart: '2026-08-01',
      periodEnd: '2026-08-31',
    });
    expect(row).toEqual({ id: 'b1' });
    expect(prisma.budget.upsert).toHaveBeenCalled();
  });
});
