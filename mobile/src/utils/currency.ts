const LOCALE_BY_CURRENCY: Record<string, string> = {
  INR: 'en-IN',
  USD: 'en-US',
  EUR: 'de-DE',
  GBP: 'en-GB',
};

export function formatCurrency(
  amount: number,
  currency = 'INR',
  locale?: string,
) {
  const resolvedLocale = locale ?? LOCALE_BY_CURRENCY[currency] ?? 'en-IN';
  return new Intl.NumberFormat(resolvedLocale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}