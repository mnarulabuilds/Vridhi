import { formatCurrency } from './currency';

describe('formatCurrency', () => {
  it('formats INR amounts', () => {
    expect(formatCurrency(1234.5, 'INR', 'en-IN')).toContain('1,234.50');
  });

  it('handles zero', () => {
    expect(formatCurrency(0)).toContain('0.00');
  });
});
