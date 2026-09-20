import { Module } from '@nestjs/common';
import { KycController } from './kyc.controller';
import { KycService } from './kyc.service';
import { AutomatedKycVerifier } from './automated-kyc-verifier';

@Module({
  controllers: [KycController],
  providers: [KycService, AutomatedKycVerifier],
  exports: [KycService],
})
export class KycModule {}
