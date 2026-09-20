import { Injectable } from '@nestjs/common';
import { SubscriptionPlan, SubscriptionStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

export type Entitlement =
  | 'bank_sync'
  | 'investment_tracking'
  | 'advanced_reports'
  | 'ai_unlimited'
  | 'export_unlimited';

const PRO_ENTITLEMENTS: Entitlement[] = [
  'bank_sync',
  'investment_tracking',
  'advanced_reports',
  'ai_unlimited',
  'export_unlimited',
];

@Injectable()
export class EntitlementsService {
  constructor(private readonly prisma: PrismaService) {}

  async ensureSubscription(userId: string) {
    return this.prisma.userSubscription.upsert({
      where: { userId },
      create: { userId, plan: SubscriptionPlan.FREE, status: SubscriptionStatus.ACTIVE },
      update: {},
    });
  }

  async hasEntitlement(userId: string, entitlement: Entitlement): Promise<boolean> {
    const sub = await this.ensureSubscription(userId);
    if (sub.status !== SubscriptionStatus.ACTIVE && sub.status !== SubscriptionStatus.TRIALING) {
      return false;
    }
    if (sub.plan === SubscriptionPlan.PRO) {
      return PRO_ENTITLEMENTS.includes(entitlement);
    }
    return entitlement === 'export_unlimited';
  }

  async getPlan(userId: string) {
    const sub = await this.ensureSubscription(userId);
    return {
      plan: sub.plan,
      status: sub.status,
      adsEnabled: sub.adsEnabled,
      currentPeriodEnd: sub.currentPeriodEnd,
    };
  }
}
