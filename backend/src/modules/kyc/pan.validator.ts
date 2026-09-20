/** Indian PAN format: 5 letters, 4 digits, 1 letter (e.g. ABCDE1234F). */
const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]$/;

export function normalizePan(value: string): string {
  return value.trim().toUpperCase();
}

export function isValidPan(value: string): boolean {
  return PAN_REGEX.test(normalizePan(value));
}

export function maskPan(value: string): string {
  const pan = normalizePan(value);
  if (pan.length !== 10) return '**********';
  return `${pan.slice(0, 2)}*****${pan.slice(7)}`;
}
