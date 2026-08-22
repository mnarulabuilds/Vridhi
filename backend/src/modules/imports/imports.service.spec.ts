import { createHash } from 'crypto';
import { importHash } from './imports.service';

describe('importHash', () => {
  it('is stable for the same ledger identity', () => {
    const a = importHash('acct', '2026-01-01T00:00:00.000Z', 12.5, 'Coffee', 'EXPENSE');
    const b = importHash('acct', '2026-01-01T00:00:00.000Z', 12.5, 'Coffee', 'EXPENSE');
    expect(a).toBe(b);
    expect(a).toHaveLength(64);
    expect(a).toBe(
      createHash('sha256').update('acct|2026-01-01T00:00:00.000Z|12.5|Coffee|EXPENSE').digest('hex'),
    );
  });

  it('changes when amount or title changes', () => {
    const a = importHash('acct', '2026-01-01T00:00:00.000Z', 12.5, 'Coffee', 'EXPENSE');
    const b = importHash('acct', '2026-01-01T00:00:00.000Z', 12.5, 'Tea', 'EXPENSE');
    expect(a).not.toBe(b);
  });
});
