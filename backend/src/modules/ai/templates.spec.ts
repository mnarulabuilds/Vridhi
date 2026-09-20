import {
  FALLBACK_HELP,
  matchCategory,
  renderBalances,
  renderBudgets,
  renderCategorySpend,
  renderInsights,
  renderNetWorth,
  renderPortfolio,
  renderRecent,
  renderSummary,
} from './templates';

const summary = {
  income: 100000,
  expenses: 40000,
  netCashFlow: 60000,
  savingsRate: 0.6,
  spendingByCategory: { Groceries: 8000, Dining: 12000, Rent: 20000 },
};

describe('matchCategory', () => {
  it('matches aliases', () => {
    expect(matchCategory(summary.spendingByCategory, 'food')?.name).toBe('Dining');
    expect(matchCategory(summary.spendingByCategory, 'grocery')?.name).toBe('Groceries');
  });
});

describe('templates', () => {
  it('renders a monthly summary without inventing numbers', () => {
    const text = renderSummary('August 2026', summary);
    expect(text).toContain('August 2026');
    expect(text).toContain('60.0%');
    expect(text).toContain('Dining');
  });

  it('renders category spend', () => {
    expect(renderCategorySpend('August 2026', summary, 'dining')).toContain('Dining');
    expect(renderCategorySpend('August 2026', summary, 'flights')).toContain('No recorded spend');
  });

  it('keeps a fallback that does not call a model', () => {
    expect(FALLBACK_HELP).toContain('recorded books');
  });

  it('renders balances, budgets, insights, net worth, portfolio, and recent', () => {
    expect(renderBalances([], { ...summary, balances: [{ name: 'Cash', balance: 100, currency: 'INR' }] })).toContain(
      'Balances',
    );
    expect(renderBudgets('August 2026', [], summary)).toContain('budget');
    expect(renderInsights('August 2026', [])).toContain('No pattern notices');
    expect(
      renderInsights('August 2026', [{ title: 'Spike', detail: 'Dining up', severity: 'warning', kind: 'trend' }]),
    ).toContain('Spike');
    expect(
      renderNetWorth('August 2026', {
        assets: 100,
        liabilities: 20,
        netWorth: 80,
        byAccount: [{ name: 'Loan', kind: 'liability', displayBalance: 20 }],
      }),
    ).toContain('Owed');
    expect(
      renderPortfolio('August 2026', {
        marketValue: 1000,
        invested: 800,
        gain: 200,
        gainPercent: 0.25,
        allocation: { EQUITY: 1000 },
      }),
    ).toContain('Allocation');
    expect(renderRecent('August 2026', [])).toContain('No transactions');
    expect(
      renderRecent('August 2026', [
        { title: 'Tea', amount: 10, type: 'EXPENSE', category: { name: 'Dining' } } as never,
      ]),
    ).toContain('Tea');
  });

  it('returns null for empty category hints', () => {
    expect(matchCategory(summary.spendingByCategory, '')).toBeNull();
  });
});
