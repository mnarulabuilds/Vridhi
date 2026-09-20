import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { EntitlementGuard } from '../../common/entitlements/entitlement.guard';
import { RequiresEntitlement } from '../../common/entitlements/require-entitlement.decorator';
import { CurrentUser } from '../../common/decorator/current-user.decorator';
import type { CurrentUserData } from '../../common/interfaces/current-user.interface';
import { PortfolioService } from './portfolio.service';

@ApiTags('portfolio')
@ApiBearerAuth()
@Controller('api/v1/portfolio')
@UseGuards(JwtAuthGuard, EntitlementGuard)
export class PortfolioController {
  constructor(private readonly portfolio: PortfolioService) {}

  @Get()
  @RequiresEntitlement('investment_tracking')
  list(@CurrentUser() user: CurrentUserData) {
    return this.portfolio.listHoldings(user.id);
  }

  @Get('summary')
  @RequiresEntitlement('investment_tracking')
  summary(@CurrentUser() user: CurrentUserData) {
    return this.portfolio.summary(user.id);
  }

  @Post('holdings')
  @RequiresEntitlement('investment_tracking')
  upsert(@CurrentUser() user: CurrentUserData, @Body() body: Record<string, unknown>) {
    return this.portfolio.upsertHolding(user.id, body as never);
  }

  @Delete('holdings/:id')
  @RequiresEntitlement('investment_tracking')
  remove(@CurrentUser() user: CurrentUserData, @Param('id') id: string) {
    return this.portfolio.deleteHolding(user.id, id);
  }
}
