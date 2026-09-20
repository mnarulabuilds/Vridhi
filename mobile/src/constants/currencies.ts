export const CURRENCIES = ['INR', 'USD', 'EUR', 'GBP'] as const;

export type CurrencyCode = (typeof CURRENCIES)[number];

export const CURRENCY_OPTIONS: Array<{ label: string; value: CurrencyCode }> = [
  { label: 'INR — Indian rupee', value: 'INR' },
  { label: 'USD — US dollar', value: 'USD' },
  { label: 'EUR — Euro', value: 'EUR' },
  { label: 'GBP — British pound', value: 'GBP' },
];

export function normalizeCurrencyCode(
  value: string | undefined | null,
  fallback: CurrencyCode = 'INR',
): CurrencyCode {
  const upper = String(value ?? '')
    .trim()
    .toUpperCase();
  return CURRENCIES.includes(upper as CurrencyCode) ? (upper as CurrencyCode) : fallback;
}
