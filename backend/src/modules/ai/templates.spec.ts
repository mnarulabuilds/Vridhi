import {
  FALLBACK_HELP,
  matchCategory,
  renderCategorySpend,
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
});
