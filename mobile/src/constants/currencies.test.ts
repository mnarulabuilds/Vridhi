import { CURRENCIES, normalizeCurrencyCode } from './currencies';

describe('normalizeCurrencyCode', () => {
  it('accepts supported codes', () => {
    for (const code of CURRENCIES) {
      expect(normalizeCurrencyCode(code)).toBe(code);
      expect(normalizeCurrencyCode(code.toLowerCase())).toBe(code);
    }
  });

  it('falls back for unknown codes', () => {
    expect(normalizeCurrencyCode('JPY')).toBe('INR');
    expect(normalizeCurrencyCode('', 'USD')).toBe('USD');
    expect(normalizeCurrencyCode(null)).toBe('INR');
  });
});
