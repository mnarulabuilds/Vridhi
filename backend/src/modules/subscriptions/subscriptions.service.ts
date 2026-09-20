import { Injectable } from '@nestjs/common';
import { SubscriptionPlan, SubscriptionStatus } from '@prisma/client';
import { EntitlementsService } from '../../common/entitlements/entitlements.service';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class SubscriptionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly entitlements: EntitlementsService,
  ) {}

  async getMine(userId: string) {
    return this.entitlements.getPlan(userId);
  }

  async upgradeToPro(userId: string, externalSubscriptionId?: string) {
    await this.entitlements.ensureSubscription(userId);
    return this.prisma.userSubscription.update({
      where: { userId },
      data: {
        plan: SubscriptionPlan.PRO,
        status: SubscriptionStatus.ACTIVE,
        adsEnabled: false,
        externalSubscriptionId,
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });
  }

  async cancel(userId: string) {
    return this.prisma.userSubscription.update({
      where: { userId },
      data: {
        plan: SubscriptionPlan.FREE,
        status: SubscriptionStatus.CANCELED,
        adsEnabled: true,
        currentPeriodEnd: null,
      },
    });
  }
}
