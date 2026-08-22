import { classifyIntent, parsePeriod } from './intent';

const NOW = new Date('2026-08-15T10:00:00');

describe('parsePeriod', () => {
  it('defaults to the current month', () => {
    const period = parsePeriod('how much did I spend', NOW);
    expect(period.periodLabel).toBe('August 2026');
  });

  it('shifts to last month', () => {
    const period = parsePeriod('spending last month', NOW);
    expect(period.periodLabel).toBe('July 2026');
  });

  it('reads a named month', () => {
    const period = parsePeriod('income in june', NOW);
    expect(period.periodLabel).toBe('June 2026');
  });
});

describe('classifyIntent', () => {
  it('detects a monthly summary', () => {
    expect(classifyIntent('How much did I spend this month?', NOW).kind).toBe('summary');
  });

  it('detects category spend', () => {
    const intent = classifyIntent('How much did I spend on groceries this month?', NOW);
    expect(intent.kind).toBe('category_spend');
    expect(intent.categoryHint).toBe('groceries');
  });

  it('detects insights', () => {
    expect(classifyIntent('What bills repeat?', NOW).kind).toBe('insights');
    expect(classifyIntent('Is anything unusual this month?', NOW).kind).toBe('insights');
  });

  it('detects budgets and balances', () => {
    expect(classifyIntent('Am I over budget?', NOW).kind).toBe('budgets');
    expect(classifyIntent('What are my account balances?', NOW).kind).toBe('balances');
  });

  it('detects recent transactions', () => {
    expect(classifyIntent('Show recent transactions', NOW).kind).toBe('recent');
  });

  it('leaves open-ended chat for the language model', () => {
    expect(classifyIntent('Can I afford a car next year?', NOW).kind).toBe('unknown');
  });
});
