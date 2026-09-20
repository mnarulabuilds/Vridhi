import { Injectable } from '@nestjs/common';
import { randomBytes } from 'crypto';
import type {
  BankAggregator,
  LinkSession,
  SyncResult,
} from './bank-aggregator.interface';

@Injectable()
export class StubBankAggregator implements BankAggregator {
  readonly providerId = 'stub';

  async createLinkSession(_userId: string): Promise<LinkSession> {
    return {
      linkToken: `stub_${randomBytes(16).toString('hex')}`,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000),
    };
  }

  async exchangePublicToken(publicToken: string) {
    return {
      externalItemId: publicToken || `item_${randomBytes(8).toString('hex')}`,
      institutionName: 'Demo Bank',
    };
  }

  async syncTransactions(_externalItemId: string): Promise<SyncResult> {
    return { transactions: [], nextCursor: undefined };
  }
}
