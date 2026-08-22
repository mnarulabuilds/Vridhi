import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorator/current-user.decorator';
import type { CurrentUserData } from '../../common/interfaces/current-user.interface';
import { ReportingService } from './reporting.service';

@Controller('api/v1/reports') @UseGuards(JwtAuthGuard)
export class ReportingController {
  constructor(private readonly reporting: ReportingService) {}
  @Get('summary') summary(@CurrentUser() user: CurrentUserData, @Query('from') from: string, @Query('to') to: string) { return this.reporting.summary(user.id, from, to); }
}
