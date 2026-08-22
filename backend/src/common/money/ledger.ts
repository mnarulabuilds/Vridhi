export type LedgerType = 'INCOME' | 'EXPENSE' | 'TRANSFER';

export interface LedgerEntry {
  type: LedgerType;
  amount: number | string | { toString(): string };
  accountId: string;
  transferToAccountId?: string | null;
}

export function signedDeltaForAccount(entry: LedgerEntry, accountId: string): number {
  const amount = Number(entry.amount);
  if (entry.type === 'INCOME' && entry.accountId === accountId) {
    return amount;
  }
  if (entry.type === 'EXPENSE' && entry.accountId === accountId) {
    return -amount;
  }
  if (entry.type === 'TRANSFER') {
    if (entry.accountId === accountId) {
      return -amount;
    }
    if (entry.transferToAccountId === accountId) {
      return amount;
    }
  }
  return 0;
}

export function currentBalance(openingBalance: number, entries: LedgerEntry[], accountId: string): number {
  return Number(openingBalance) + entries.reduce((sum, entry) => sum + signedDeltaForAccount(entry, accountId), 0);
}

export function cashFlow(entries: LedgerEntry[]): { income: number; expenses: number } {
  let income = 0;
  let expenses = 0;
  for (const entry of entries) {
    const amount = Number(entry.amount);
    if (entry.type === 'INCOME') income += amount;
    if (entry.type === 'EXPENSE') expenses += amount;
  }
  return { income, expenses };
}

export function savingsRate(income: number, expenses: number): number {
  return income ? (income - expenses) / income : 0;
}
