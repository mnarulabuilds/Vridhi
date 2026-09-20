import { Module } from '@nestjs/common';
import { ReportingController } from './reporting.controller';
import { ReportingService } from './reporting.service';
import { FxService } from '../../common/money/fx.service';

@Module({
  controllers: [ReportingController],
  providers: [ReportingService, FxService],
  exports: [ReportingService],
})
export class ReportingModule {}
