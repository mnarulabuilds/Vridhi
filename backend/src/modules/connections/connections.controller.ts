import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { EntitlementGuard } from '../../common/entitlements/entitlement.guard';
import { RequiresEntitlement } from '../../common/entitlements/require-entitlement.decorator';
import { CurrentUser } from '../../common/decorator/current-user.decorator';
import type { CurrentUserData } from '../../common/interfaces/current-user.interface';
import { ConnectionsService } from './connections.service';

@ApiTags('connections')
@ApiBearerAuth()
@Controller('api/v1/connections')
@UseGuards(JwtAuthGuard, EntitlementGuard)
export class ConnectionsController {
  constructor(private readonly connections: ConnectionsService) {}

  @Get()
  list(@CurrentUser() user: CurrentUserData) {
    return this.connections.list(user.id);
  }

  @Post('link-session')
  @RequiresEntitlement('bank_sync')
  createLinkSession(@CurrentUser() user: CurrentUserData) {
    return this.connections.createLinkSession(user.id);
  }

  @Post('complete')
  @RequiresEntitlement('bank_sync')
  complete(@CurrentUser() user: CurrentUserData, @Body() body: { publicToken: string }) {
    return this.connections.completeLink(user.id, body.publicToken);
  }

  @Post(':id/sync')
  @RequiresEntitlement('bank_sync')
  sync(@CurrentUser() user: CurrentUserData, @Param('id') id: string) {
    return this.connections.sync(user.id, id);
  }
}
