import { NotFoundException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { toPublicProfile, UsersService } from './users.service';

describe('UsersService', () => {
  const prisma = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    account: { findMany: jest.fn() },
    category: { findMany: jest.fn() },
    budget: { findMany: jest.fn() },
    transaction: { findMany: jest.fn() },
    aiConversation: { findMany: jest.fn() },
  };
  const service = new UsersService(prisma as any);

  beforeEach(() => jest.clearAllMocks());

  it('omits passwordHash in toPublicProfile', () => {
    expect(
      toPublicProfile({
        id: '1',
        name: 'Maya',
        email: 'maya@example.com',
        preferredCurrency: 'INR',
        timezone: 'Asia/Kolkata',
        locale: 'en-IN',
      }),
    ).toEqual({
      id: '1',
      name: 'Maya',
      email: 'maya@example.com',
      onboardingCompletedAt: null,
      preferredCurrency: 'INR',
      timezone: 'Asia/Kolkata',
      locale: 'en-IN',
    });
  });

  it('marks onboarding complete', async () => {
    prisma.user.update.mockResolvedValue({
      id: 'u1',
      name: 'Maya',
      email: 'maya@example.com',
      preferredCurrency: 'INR',
      timezone: 'Asia/Kolkata',
      locale: 'en-IN',
      onboardingCompletedAt: new Date('2026-01-01'),
    });
    const profile = await service.completeOnboarding('u1');
    expect(profile.onboardingCompletedAt).toBeTruthy();
  });

  it('updates profile fields', async () => {
    prisma.user.update.mockResolvedValue({
      id: 'u1',
      name: 'New',
      email: 'a@b.com',
      preferredCurrency: 'USD',
      timezone: 'UTC',
      locale: 'en-US',
    });
    const profile = await service.updateProfile('u1', { name: ' New ', preferredCurrency: 'usd' });
    expect(profile.name).toBe('New');
    expect(profile.preferredCurrency).toBe('USD');
  });

  it('exports user data', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 'u1',
      name: 'Maya',
      email: 'maya@example.com',
      preferredCurrency: 'INR',
      timezone: 'Asia/Kolkata',
      locale: 'en-IN',
      passwordHash: 'hash',
    });
    prisma.account.findMany.mockResolvedValue([]);
    prisma.category.findMany.mockResolvedValue([]);
    prisma.budget.findMany.mockResolvedValue([]);
    prisma.transaction.findMany.mockResolvedValue([]);
    prisma.aiConversation.findMany.mockResolvedValue([]);
    const payload = await service.exportData('u1');
    expect(payload.profile.email).toBe('maya@example.com');
    expect(payload.exportedAt).toBeTruthy();
  });

  it('deletes account when password matches', async () => {
    const hash = await bcrypt.hash('secret12', 4);
    prisma.user.findUnique.mockResolvedValue({ id: 'u1', passwordHash: hash });
    prisma.user.delete.mockResolvedValue({});
    await expect(service.deleteAccount('u1', 'secret12')).resolves.toEqual({ success: true });
  });

  it('rejects delete with wrong password', async () => {
    const hash = await bcrypt.hash('secret12', 4);
    prisma.user.findUnique.mockResolvedValue({ id: 'u1', passwordHash: hash });
    await expect(service.deleteAccount('u1', 'wrong')).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('throws when export user is missing', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    await expect(service.exportData('missing')).rejects.toBeInstanceOf(NotFoundException);
  });
});
