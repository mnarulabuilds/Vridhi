import { convertCurrency, createConverter, DEFAULT_USD_RATES, normalizeCurrency } from './fx';

describe('fx', () => {
  it('converts via USD pivot', () => {
    expect(convertCurrency(8400, 'INR', 'USD', DEFAULT_USD_RATES)).toBeCloseTo(100, 5);
    expect(convertCurrency(100, 'USD', 'INR', DEFAULT_USD_RATES)).toBeCloseTo(8400, 5);
    expect(convertCurrency(8400, 'INR', 'EUR', DEFAULT_USD_RATES)).toBeCloseTo(92, 5);
  });

  it('returns same amount for identical currency', () => {
    expect(convertCurrency(500, 'INR', 'INR', DEFAULT_USD_RATES)).toBe(500);
  });

  it('createConverter targets base currency', () => {
    const toInr = createConverter('INR', DEFAULT_USD_RATES);
    expect(toInr(100, 'USD')).toBeCloseTo(8400, 5);
  });

  it('normalizes invalid currency codes', () => {
    expect(normalizeCurrency('US')).toBe('INR');
    expect(normalizeCurrency('usd')).toBe('USD');
  });

  it('throws when FX rate missing', () => {
    expect(() => convertCurrency(1, 'INR', 'XXX', DEFAULT_USD_RATES)).toThrow(/Missing FX rate/);
  });
});
