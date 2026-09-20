import { Global, Module } from '@nestjs/common';
import { EntitlementsService } from './entitlements.service';
import { EntitlementGuard } from './entitlement.guard';

@Global()
@Module({
  providers: [EntitlementsService, EntitlementGuard],
  exports: [EntitlementsService, EntitlementGuard],
})
export class EntitlementsModule {}
