import { SubscriptionsService } from './subscriptions.service';

describe('SubscriptionsService', () => {
  const prisma = { userSubscription: { update: jest.fn() } };
  const entitlements = {
    ensureSubscription: jest.fn(),
    getPlan: jest.fn().mockResolvedValue({ plan: 'FREE' }),
  };
  const service = new SubscriptionsService(prisma as never, entitlements as never);

  it('returns current plan', async () => {
    await expect(service.getMine('u1')).resolves.toEqual({ plan: 'FREE' });
  });

  it('upgrades and cancels', async () => {
    prisma.userSubscription.update.mockResolvedValue({ plan: 'PRO' });
    await expect(service.upgradeToPro('u1', 'sub_1')).resolves.toEqual({ plan: 'PRO' });
    await expect(service.cancel('u1')).resolves.toBeDefined();
  });
});
