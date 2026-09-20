import { ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { EntitlementGuard } from './entitlement.guard';
import { EntitlementsService } from './entitlements.service';

describe('EntitlementGuard', () => {
  const reflector = { get: jest.fn() };
  const entitlements = { hasEntitlement: jest.fn() };
  const guard = new EntitlementGuard(reflector as never, entitlements as never);

  it('allows when no entitlement metadata', async () => {
    reflector.get.mockReturnValue(undefined);
    await expect(guard.canActivate({ getHandler: () => null, switchToHttp: () => ({ getRequest: () => ({}) }) } as never)).resolves.toBe(true);
  });

  it('allows when entitlement granted', async () => {
    reflector.get.mockReturnValue('bank_sync');
    entitlements.hasEntitlement.mockResolvedValue(true);
    await expect(
      guard.canActivate({
        getHandler: () => null,
        switchToHttp: () => ({ getRequest: () => ({ user: { id: 'u1' } }) }),
      } as never),
    ).resolves.toBe(true);
  });

  it('denies when entitlement missing', async () => {
    reflector.get.mockReturnValue('bank_sync');
    entitlements.hasEntitlement.mockResolvedValue(false);
    await expect(
      guard.canActivate({
        getHandler: () => null,
        switchToHttp: () => ({ getRequest: () => ({ user: { id: 'u1' } }) }),
      } as never),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});
