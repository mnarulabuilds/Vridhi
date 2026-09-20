import { ConflictException, NotFoundException } from '@nestjs/common';
import { CategoriesService } from './categories.service';

describe('CategoriesService', () => {
  const prisma = {
    category: {
      findMany: jest.fn(),
      create: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
  };
  const service = new CategoriesService(prisma as any);

  beforeEach(() => jest.clearAllMocks());

  it('lists active categories by default', async () => {
    prisma.category.findMany.mockResolvedValue([]);
    await service.findAll('u1');
    expect(prisma.category.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: 'u1', isArchived: false } }),
    );
  });

  it('can include archived categories', async () => {
    prisma.category.findMany.mockResolvedValue([]);
    await service.findAll('u1', true);
    expect(prisma.category.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: 'u1' } }),
    );
  });

  it('creates a trimmed category', async () => {
    prisma.category.create.mockResolvedValue({ id: 'c1', name: 'Fuel' });
    await service.create('u1', { name: '  Fuel  ', type: 'EXPENSE' as any });
    expect(prisma.category.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ name: 'Fuel', userId: 'u1' }) }),
    );
  });

  it('maps duplicate names to conflict', async () => {
    prisma.category.create.mockRejectedValue({ code: 'P2002' });
    await expect(service.create('u1', { name: 'Fuel', type: 'EXPENSE' as any })).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('archives and unarchives', async () => {
    prisma.category.findFirst.mockResolvedValueOnce({ id: 'c1' });
    prisma.category.update.mockResolvedValue({ id: 'c1', isArchived: true });
    await service.archive('u1', 'c1');
    prisma.category.findFirst.mockResolvedValueOnce({ id: 'c1' });
    await service.unarchive('u1', 'c1');
    expect(prisma.category.update).toHaveBeenCalledTimes(2);
  });

  it('rethrows unexpected prisma errors', async () => {
    prisma.category.create.mockRejectedValue(new Error('db down'));
    await expect(service.create('u1', { name: 'Fuel', type: 'EXPENSE' as any })).rejects.toThrow('db down');
  });

  it('throws when unarchive target is missing', async () => {
    prisma.category.findFirst.mockResolvedValue(null);
    await expect(service.unarchive('u1', 'c1')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('throws when archive target is missing', async () => {
    prisma.category.findFirst.mockResolvedValue(null);
    await expect(service.archive('u1', 'c1')).rejects.toBeInstanceOf(NotFoundException);
  });
});
