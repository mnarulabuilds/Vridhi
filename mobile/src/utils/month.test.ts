import { monthBounds, shiftMonth } from './month';

describe('month utils', () => {
  it('returns ISO bounds for a month', () => {
    const bounds = monthBounds(new Date(2026, 7, 15));
    expect(bounds.label).toContain('2026');
    expect(new Date(bounds.from).getMonth()).toBe(7);
    expect(new Date(bounds.to).getMonth()).toBe(7);
  });

  it('shifts months', () => {
    const next = shiftMonth(new Date('2026-01-10'), 1);
    expect(next.getMonth()).toBe(1);
  });
});
