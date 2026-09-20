import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { EntitlementsService } from './entitlements.service';
import { ENTITLEMENT_KEY } from './require-entitlement.decorator';
import type { CurrentUserData } from '../interfaces/current-user.interface';

@Injectable()
export class EntitlementGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly entitlements: EntitlementsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const entitlement = this.reflector.get<string | undefined>(ENTITLEMENT_KEY, context.getHandler());
    if (!entitlement) {
      return true;
    }
    const request = context.switchToHttp().getRequest<{ user?: CurrentUserData }>();
    const userId = request.user?.id;
    if (!userId) {
      throw new ForbiddenException('Authentication required');
    }
    const allowed = await this.entitlements.hasEntitlement(userId, entitlement as never);
    if (!allowed) {
      throw new ForbiddenException('Upgrade to Vridhi Pro to use this feature');
    }
    return true;
  }
}
