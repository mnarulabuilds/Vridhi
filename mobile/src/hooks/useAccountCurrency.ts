import { useMemo } from 'react';
import { useAccounts } from '@/src/hooks/useAccounts';
import { normalizeCurrencyCode, type CurrencyCode } from '@/src/constants/currencies';

/** Resolve display currency for an account-scoped amount (balance, transaction). */
export function useAccountCurrencyLookup() {
  const { accounts } = useAccounts();

  return useMemo(() => {
    const byId = new Map<string, CurrencyCode>();
    for (const account of accounts) {
      byId.set(account.id, normalizeCurrencyCode(account.currency));
    }
    return (accountId: string | undefined | null): CurrencyCode =>
      accountId ? (byId.get(accountId) ?? 'INR') : 'INR';
  }, [accounts]);
}
