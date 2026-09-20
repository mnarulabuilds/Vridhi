import { Module } from '@nestjs/common';
import { ConnectionsController } from './connections.controller';
import { ConnectionsService } from './connections.service';
import { StubBankAggregator } from './aggregators/stub-bank-aggregator';
import { BANK_AGGREGATOR } from './aggregators/bank-aggregator.interface';

@Module({
  controllers: [ConnectionsController],
  providers: [
    ConnectionsService,
    StubBankAggregator,
    { provide: BANK_AGGREGATOR, useExisting: StubBankAggregator },
  ],
  exports: [ConnectionsService],
})
export class ConnectionsModule {}
