import { SetMetadata } from '@nestjs/common';
import type { Entitlement } from './entitlements.service';

export const ENTITLEMENT_KEY = 'entitlement';

export const RequiresEntitlement = (entitlement: Entitlement) =>
  SetMetadata(ENTITLEMENT_KEY, entitlement);
