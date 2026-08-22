import { currentBalance, type LedgerEntry } from './ledger';

export const LIABILITY_ACCOUNT_TYPES = ['CREDIT_CARD', 'LOAN'] as const;

export type AccountKind = 'asset' | 'liability';

export interface DatedLedgerEntry extends LedgerEntry {
  transactionDate?: Date | string;
}

export function isLiabilityType(type: string): boolean {
  return (LIABILITY_ACCOUNT_TYPES as readonly string[]).includes(type);
}

export function accountKind(type: string): AccountKind {
  return isLiabilityType(type) ? 'liability' : 'asset';
}

/**
 * Ledger balance follows the cash-account sign: expenses go down.
 * For liability accounts the opening balance is "amount owed", so spending
 * increases what you owe: owed = opening - ledgerDelta = 2*opening - ledgerBalance.
 */
export function liabilityOwed(openingBalance: number, ledgerBalance: number): number {
  return 2 * Number(openingBalance) - Number(ledgerBalance);
}

export function ledgerBalanceAsOf(
  openingBalance: number,
  entries: DatedLedgerEntry[],
  accountId: string,
  asOf?: Date,
) {
  const applicable = asOf
    ? entries.filter((entry) => {
        if (!entry.transactionDate) return true;
        return new Date(entry.transactionDate).getTime() <= asOf.getTime();
      })
    : entries;
  return currentBalance(Number(openingBalance), applicable, accountId);
}

export function positionForAccount(input: {
  id: string;
  type: string;
  openingBalance: number | string | { toString(): string };
  createdAt?: Date | string;
  entries: DatedLedgerEntry[];
  asOf?: Date;
}) {
  if (input.asOf && input.createdAt && new Date(input.createdAt).getTime() > input.asOf.getTime()) {
    return {
      kind: accountKind(input.type),
      ledgerBalance: 0,
      displayBalance: 0,
      contribution: 0,
    };
  }
  const opening = Number(input.openingBalance);
  const ledger = ledgerBalanceAsOf(opening, input.entries, input.id, input.asOf);
  const kind = accountKind(input.type);
  const displayBalance = kind === 'liability' ? liabilityOwed(opening, ledger) : ledger;
  const contribution = kind === 'liability' ? -displayBalance : ledger;
  return { kind, ledgerBalance: ledger, displayBalance, contribution };
}

export function summarizeNetWorth(
  accounts: Array<{
    id: string;
    name: string;
    type: string;
    currency?: string;
    openingBalance: number | string | { toString(): string };
    createdAt?: Date | string;
    entries: DatedLedgerEntry[];
  }>,
  asOf?: Date,
) {
  const byAccount = accounts.map((account) => {
    const position = positionForAccount({ ...account, asOf });
    return {
      accountId: account.id,
      name: account.name,
      type: account.type,
      currency: account.currency ?? 'INR',
      kind: position.kind,
      ledgerBalance: position.ledgerBalance,
      displayBalance: position.displayBalance,
      contribution: position.contribution,
    };
  });
  const assets = byAccount
    .filter((row) => row.kind === 'asset')
    .reduce((sum, row) => sum + row.contribution, 0);
  const liabilities = byAccount
    .filter((row) => row.kind === 'liability')
    .reduce((sum, row) => sum + row.displayBalance, 0);
  return {
    assets,
    liabilities,
    netWorth: assets - liabilities,
    byAccount,
  };
}
