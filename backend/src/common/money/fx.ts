/** ISO currency code → units of that currency per 1 USD (e.g. INR: 84 means 1 USD = 84 INR). */
export type UsdPivotRates = Record<string, number>;

export const DEFAULT_USD_RATES: UsdPivotRates = {
  USD: 1,
  INR: 84,
  EUR: 0.92,
  GBP: 0.79,
};

export function normalizeCurrency(code: string | undefined | null, fallback = 'INR'): string {
  const normalized = String(code ?? fallback)
    .trim()
    .toUpperCase();
  return normalized.length === 3 ? normalized : fallback;
}

export function convertCurrency(
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  rates: UsdPivotRates,
): number {
  const from = normalizeCurrency(fromCurrency);
  const to = normalizeCurrency(toCurrency);
  if (from === to) {
    return amount;
  }
  const fromRate = rates[from];
  const toRate = rates[to];
  if (!fromRate || !toRate || fromRate <= 0 || toRate <= 0) {
    throw new Error(`Missing FX rate for ${from} or ${to}`);
  }
  const usd = amount / fromRate;
  return usd * toRate;
}

export function createConverter(toCurrency: string, rates: UsdPivotRates) {
  const target = normalizeCurrency(toCurrency);
  return (amount: number, fromCurrency: string) =>
    convertCurrency(amount, fromCurrency, target, rates);
}
