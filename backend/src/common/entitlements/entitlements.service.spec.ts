import { SubscriptionPlan } from '@prisma/client';
import { EntitlementsService } from './entitlements.service';

describe('EntitlementsService', () => {
  const prisma = {
    userSubscription: {
      upsert: jest.fn(),
    },
  };
  const service = new EntitlementsService(prisma as never);

  beforeEach(() => jest.clearAllMocks());

  it('grants pro entitlements to active pro users', async () => {
    prisma.userSubscription.upsert.mockResolvedValue({
      plan: SubscriptionPlan.PRO,
      status: 'ACTIVE',
    });
    await expect(service.hasEntitlement('u1', 'bank_sync')).resolves.toBe(true);
  });

  it('denies bank sync on free plan', async () => {
    prisma.userSubscription.upsert.mockResolvedValue({
      plan: SubscriptionPlan.FREE,
      status: 'ACTIVE',
    });
    await expect(service.hasEntitlement('u1', 'bank_sync')).resolves.toBe(false);
  });

  it('returns plan details', async () => {
    prisma.userSubscription.upsert.mockResolvedValue({
      plan: SubscriptionPlan.FREE,
      status: 'ACTIVE',
      adsEnabled: true,
      currentPeriodEnd: null,
    });
    await expect(service.getPlan('u1')).resolves.toMatchObject({ plan: SubscriptionPlan.FREE });
  });
});
