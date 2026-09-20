import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorator/current-user.decorator';
import type { CurrentUserData } from '../../common/interfaces/current-user.interface';
import { KycService } from './kyc.service';
import { SubmitKycDto } from './dto/submit-kyc.dto';

@ApiTags('kyc')
@ApiBearerAuth()
@Controller('api/v1/kyc')
@UseGuards(JwtAuthGuard)
export class KycController {
  constructor(private readonly kyc: KycService) {}

  @Get('status')
  status(@CurrentUser() user: CurrentUserData) {
    return this.kyc.status(user.id);
  }

  @Post('submit')
  submit(@CurrentUser() user: CurrentUserData, @Body() dto: SubmitKycDto) {
    return this.kyc.submit(user.id, dto);
  }
}
