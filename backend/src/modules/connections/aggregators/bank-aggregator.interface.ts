export interface LinkSession {
  linkToken: string;
  expiresAt: Date;
}

export interface SyncCursor {
  cursor?: string;
}

export interface NormalizedBankTransaction {
  externalId: string;
  title: string;
  amount: number;
  type: 'INCOME' | 'EXPENSE';
  merchant?: string;
  transactionDate: Date;
  pending?: boolean;
}

export interface SyncResult {
  transactions: NormalizedBankTransaction[];
  nextCursor?: string;
}

export interface BankAggregator {
  readonly providerId: string;
  createLinkSession(userId: string): Promise<LinkSession>;
  exchangePublicToken(publicToken: string): Promise<{ externalItemId: string; institutionName?: string }>;
  syncTransactions(externalItemId: string, cursor?: SyncCursor): Promise<SyncResult>;
}

export const BANK_AGGREGATOR = Symbol('BANK_AGGREGATOR');
