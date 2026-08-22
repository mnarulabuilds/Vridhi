export function monthBounds(date: Date) {
  const from = new Date(date.getFullYear(), date.getMonth(), 1);
  const to = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
  return {
    from: from.toISOString(),
    to: to.toISOString(),
    periodStart: from.toISOString(),
    label: from.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }),
  };
}

export function shiftMonth(date: Date, delta: number) {
  return new Date(date.getFullYear(), date.getMonth() + delta, 1);
}
