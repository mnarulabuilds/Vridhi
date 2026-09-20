import { useAuth } from '@/src/providers/auth-provider';
import { normalizeCurrencyCode, type CurrencyCode } from '@/src/constants/currencies';

/** User's profile currency — drives display for aggregated / converted amounts. */
export function usePreferredCurrency(): CurrencyCode {
  const { user } = useAuth();
  return normalizeCurrencyCode(user?.preferredCurrency);
}

/** Currency for totals from reporting APIs (falls back to profile while loading). */
export function useReportingCurrency(apiBaseCurrency?: string | null): CurrencyCode {
  const preferred = usePreferredCurrency();
  if (apiBaseCurrency) {
    return normalizeCurrencyCode(apiBaseCurrency);
  }
  return preferred;
}
