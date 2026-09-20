import { Global, Module } from '@nestjs/common';
import { LedgerLoaderService } from './ledger-loader.service';

@Global()
@Module({
  providers: [LedgerLoaderService],
  exports: [LedgerLoaderService],
})
export class LedgerModule {}
