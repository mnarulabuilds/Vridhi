import { NotFoundException } from '@nestjs/common';
import { GoalsService } from './goals.service';

describe('GoalsService', () => {
  const prisma = {
    goal: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  };
  const service = new GoalsService(prisma as never);

  it('lists goals', async () => {
    prisma.goal.findMany.mockResolvedValue([{ id: 'g1' }]);
    await expect(service.list('u1')).resolves.toHaveLength(1);
  });

  it('creates a goal', async () => {
    prisma.goal.create.mockResolvedValue({ id: 'g1', name: 'Emergency' });
    const goal = await service.upsert('u1', { name: 'Emergency', targetAmount: 50000 });
    expect(goal.id).toBe('g1');
  });

  it('throws when completing unknown goal', async () => {
    prisma.goal.findFirst.mockResolvedValue(null);
    await expect(service.complete('u1', 'missing')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('updates an existing goal', async () => {
    prisma.goal.findFirst.mockResolvedValue({ id: 'g1' });
    prisma.goal.update.mockResolvedValue({ id: 'g1', name: 'Updated' });
    await expect(service.upsert('u1', { id: 'g1', name: 'Updated', targetAmount: 1 })).resolves.toMatchObject({
      name: 'Updated',
    });
  });

  it('completes an existing goal', async () => {
    prisma.goal.findFirst.mockResolvedValue({ id: 'g1', targetAmount: 100 });
    prisma.goal.update.mockResolvedValue({ id: 'g1', status: 'COMPLETED' });
    await expect(service.complete('u1', 'g1')).resolves.toMatchObject({ status: 'COMPLETED' });
  });
});
