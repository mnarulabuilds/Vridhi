import { Body, Controller, Get, Put, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorator/current-user.decorator';
import type { CurrentUserData } from '../../common/interfaces/current-user.interface';
import { BudgetsService } from './budgets.service';
import { UpsertBudgetDto } from './dto/upsert-budget.dto';

@Controller('api/v1/budgets') @UseGuards(JwtAuthGuard)
export class BudgetsController {
  constructor(private readonly budgets: BudgetsService) {}
  @Get() findForPeriod(@CurrentUser() user: CurrentUserData, @Query('periodStart') periodStart: string) { return this.budgets.findForPeriod(user.id, new Date(periodStart)); }
  @Put() upsert(@CurrentUser() user: CurrentUserData, @Body() dto: UpsertBudgetDto) { return this.budgets.upsert(user.id, dto); }
}
