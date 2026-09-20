import { isValidPan, maskPan, normalizePan } from './pan.validator';

describe('pan.validator', () => {
  it('validates PAN format', () => {
    expect(isValidPan('abcde1234f')).toBe(true);
    expect(isValidPan('ABCDE1234F')).toBe(true);
    expect(isValidPan('ABCD1234F')).toBe(false);
  });

  it('masks PAN for display', () => {
    expect(maskPan('ABCDE1234F')).toBe('AB*****34F');
    expect(maskPan('short')).toBe('**********');
  });

  it('normalizes casing', () => {
    expect(normalizePan(' abcdE1234f ')).toBe('ABCDE1234F');
  });
});
