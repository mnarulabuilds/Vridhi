import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorator/current-user.decorator';
import type { CurrentUserData } from '../../common/interfaces/current-user.interface';
import { GoalsService } from './goals.service';

@ApiTags('goals')
@ApiBearerAuth()
@Controller('api/v1/goals')
@UseGuards(JwtAuthGuard)
export class GoalsController {
  constructor(private readonly goals: GoalsService) {}

  @Get()
  list(@CurrentUser() user: CurrentUserData) {
    return this.goals.list(user.id);
  }

  @Post()
  upsert(@CurrentUser() user: CurrentUserData, @Body() body: Record<string, unknown>) {
    return this.goals.upsert(user.id, body as never);
  }

  @Post(':id/complete')
  complete(@CurrentUser() user: CurrentUserData, @Param('id') id: string) {
    return this.goals.complete(user.id, id);
  }
}
