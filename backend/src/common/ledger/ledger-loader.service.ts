import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type { DatedLedgerEntry } from '../money/net-worth';

const ledgerSelect = {
  amount: true,
  type: true,
  accountId: true,
  transferToAccountId: true,
  transactionDate: true,
} as const;

export type LedgerEntriesByAccount = Map<string, DatedLedgerEntry[]>;

@Injectable()
export class LedgerLoaderService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Loads ledger rows for the user's accounts in one query and groups by account id.
   */
  async loadEntriesForAccounts(
    userId: string,
    accountIds: string[],
    range?: { from?: Date; to?: Date },
  ): Promise<LedgerEntriesByAccount> {
    const grouped: LedgerEntriesByAccount = new Map(accountIds.map((id) => [id, []]));
    if (accountIds.length === 0) {
      return grouped;
    }

    const dateFilter =
      range?.from || range?.to
        ? {
            transactionDate: {
              ...(range.from ? { gte: range.from } : {}),
              ...(range.to ? { lte: range.to } : {}),
            },
          }
        : {};

    const rows = await this.prisma.transaction.findMany({
      where: {
        account: { userId },
        OR: [{ accountId: { in: accountIds } }, { transferToAccountId: { in: accountIds } }],
        ...dateFilter,
      },
      select: ledgerSelect,
    });

    for (const row of rows) {
      const entry: DatedLedgerEntry = {
        type: row.type,
        amount: row.amount,
        accountId: row.accountId,
        transferToAccountId: row.transferToAccountId,
        transactionDate: row.transactionDate,
      };
      if (grouped.has(row.accountId)) {
        grouped.get(row.accountId)!.push(entry);
      }
      if (row.transferToAccountId && grouped.has(row.transferToAccountId)) {
        grouped.get(row.transferToAccountId)!.push(entry);
      }
    }

    return grouped;
  }
}
