import {
  buildNotices,
  cashFlowByMonth,
  detectRecurring,
  detectUnusualCategories,
  monthKey,
} from './insights';

function expense(partial: { title: string; amount: number; month: string; category?: string; merchant?: string }) {
  const [year, month] = partial.month.split('-').map(Number);
  return {
    title: partial.title,
    merchant: partial.merchant ?? null,
    amount: partial.amount,
    type: 'EXPENSE' as const,
    categoryName: partial.category ?? 'Dining',
    transactionDate: new Date(year, month - 1, 10),
  };
}

describe('insights', () => {
  it('detects a regular bill across months', () => {
    const txns = ['2026-01', '2026-02', '2026-03', '2026-04'].map((month) =>
      expense({ title: 'Netflix', amount: 199, month, category: 'Entertainment' }),
    );
    const recurring = detectRecurring(txns);
    expect(recurring[0]?.label).toMatch(/Netflix/i);
    expect(recurring[0]?.monthsSeen).toBe(4);
  });

  it('flags a category spike vs recent months', () => {
    const txns = [
      expense({ title: 'Lunch', amount: 800, month: '2026-03', category: 'Dining' }),
      expense({ title: 'Lunch', amount: 900, month: '2026-04', category: 'Dining' }),
      expense({ title: 'Lunch', amount: 850, month: '2026-05', category: 'Dining' }),
      expense({ title: 'Dinner out', amount: 4000, month: '2026-06', category: 'Dining' }),
    ];
    const unusual = detectUnusualCategories(txns, '2026-06');
    expect(unusual[0]?.categoryName).toBe('Dining');
    expect(unusual[0]?.ratio).toBeGreaterThan(1.5);
  });

  it('builds a savings-rate notice when the rate drops', () => {
    const savingsRateByMonth = [
      { month: '2026-03', income: 100000, expenses: 40000, savingsRate: 0.6 },
      { month: '2026-04', income: 100000, expenses: 45000, savingsRate: 0.55 },
      { month: '2026-05', income: 100000, expenses: 40000, savingsRate: 0.6 },
      { month: '2026-06', income: 100000, expenses: 90000, savingsRate: 0.1 },
    ];
    const notices = buildNotices({
      focusMonth: '2026-06',
      recurring: [],
      unusual: [],
      savingsRateByMonth,
    });
    expect(notices.some((notice) => notice.kind === 'trend' && notice.severity === 'warning')).toBe(true);
  });

  it('groups cash flow by month', () => {
    const rows = cashFlowByMonth([
      { ...expense({ title: 'Rent', amount: 20, month: '2026-01' }), type: 'INCOME', amount: 100 },
      expense({ title: 'Rent', amount: 40, month: '2026-01' }),
    ]);
    expect(monthKey(new Date(2026, 0, 1))).toBe('2026-01');
    expect(rows[0]).toMatchObject({ month: '2026-01', income: 100, expenses: 40, savingsRate: 0.6 });
  });
});
