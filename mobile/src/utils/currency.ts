export function formatCurrency(
  amount: number,
  currency = 'INR',
  locale = 'en-IN',
) {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}