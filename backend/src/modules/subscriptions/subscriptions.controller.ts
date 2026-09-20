import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorator/current-user.decorator';
import type { CurrentUserData } from '../../common/interfaces/current-user.interface';
import { SubscriptionsService } from './subscriptions.service';

@ApiTags('subscriptions')
@ApiBearerAuth()
@Controller('api/v1/subscriptions')
@UseGuards(JwtAuthGuard)
export class SubscriptionsController {
  constructor(private readonly subscriptions: SubscriptionsService) {}

  @Get('me')
  me(@CurrentUser() user: CurrentUserData) {
    return this.subscriptions.getMine(user.id);
  }

  @Post('upgrade')
  upgrade(@CurrentUser() user: CurrentUserData, @Body() body: { externalSubscriptionId?: string }) {
    return this.subscriptions.upgradeToPro(user.id, body.externalSubscriptionId);
  }

  @Post('cancel')
  cancel(@CurrentUser() user: CurrentUserData) {
    return this.subscriptions.cancel(user.id);
  }
}
