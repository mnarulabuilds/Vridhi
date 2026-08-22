import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorator/current-user.decorator';
import type { CurrentUserData } from '../../common/interfaces/current-user.interface';
import { ReportingService } from './reporting.service';

@ApiTags('reports')
@ApiBearerAuth()
@Controller('api/v1/reports')
@UseGuards(JwtAuthGuard)
export class ReportingController {
  constructor(private readonly reporting: ReportingService) {}

  @Get('summary')
  summary(
    @CurrentUser() user: CurrentUserData,
    @Query('from') from: string,
    @Query('to') to: string,
  ) {
    return this.reporting.summary(user.id, from, to);
  }

  @Get('insights')
  insights(@CurrentUser() user: CurrentUserData, @Query('asOf') asOf?: string) {
    return this.reporting.insights(user.id, asOf);
  }

  @Get('net-worth')
  netWorth(@CurrentUser() user: CurrentUserData, @Query('asOf') asOf?: string) {
    return this.reporting.netWorth(user.id, asOf);
  }
}
