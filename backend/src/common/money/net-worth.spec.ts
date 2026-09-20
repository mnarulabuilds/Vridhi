import { createConverter, DEFAULT_USD_RATES } from './fx';
import { liabilityOwed, positionForAccount, summarizeNetWorth } from './net-worth';

const expense = (accountId: string, amount: number, date = '2026-08-10') => ({
  type: 'EXPENSE' as const,
  amount,
  accountId,
  transactionDate: date,
});

const transfer = (from: string, to: string, amount: number, date = '2026-08-12') => ({
  type: 'TRANSFER' as const,
  amount,
  accountId: from,
  transferToAccountId: to,
  transactionDate: date,
});

describe('liabilityOwed', () => {
  it('treats a positive opening as amount owed', () => {
    expect(liabilityOwed(50_000, 50_000)).toBe(50_000);
  });

  it('increases owed when the cash-signed ledger drops after a spend', () => {
    expect(liabilityOwed(50_000, 49_000)).toBe(51_000);
    expect(liabilityOwed(0, -1_000)).toBe(1_000);
  });
});

describe('positionForAccount', () => {
  it('keeps savings as an asset', () => {
    const position = positionForAccount({
      id: 'sav',
      type: 'SAVINGS',
      openingBalance: 100_000,
      entries: [expense('sav', 10_000)],
    });
    expect(position.kind).toBe('asset');
    expect(position.displayBalance).toBe(90_000);
    expect(position.contribution).toBe(90_000);
  });

  it('treats credit-card opening as debt and spends as more debt', () => {
    const position = positionForAccount({
      id: 'cc',
      type: 'CREDIT_CARD',
      openingBalance: 50_000,
      entries: [expense('cc', 1_000)],
    });
    expect(position.kind).toBe('liability');
    expect(position.displayBalance).toBe(51_000);
    expect(position.contribution).toBe(-51_000);
  });

  it('reduces card debt when you pay the card', () => {
    const position = positionForAccount({
      id: 'cc',
      type: 'CREDIT_CARD',
      openingBalance: 50_000,
      entries: [transfer('sav', 'cc', 5_000)],
    });
    expect(position.displayBalance).toBe(45_000);
  });

  it('ignores accounts created after the as-of date', () => {
    const position = positionForAccount({
      id: 'new',
      type: 'SAVINGS',
      openingBalance: 80_000,
      createdAt: '2026-08-01',
      entries: [],
      asOf: new Date('2026-07-31T23:59:59'),
    });
    expect(position.contribution).toBe(0);
  });
});

describe('summarizeNetWorth', () => {
  it('is assets minus liabilities', () => {
    const summary = summarizeNetWorth([
      {
        id: 'sav',
        name: 'HDFC',
        type: 'SAVINGS',
        openingBalance: 100_000,
        entries: [expense('sav', 10_000)],
      },
      {
        id: 'cc',
        name: 'Visa',
        type: 'CREDIT_CARD',
        openingBalance: 20_000,
        entries: [expense('cc', 1_000)],
      },
    ]);
    expect(summary.assets).toBe(90_000);
    expect(summary.liabilities).toBe(21_000);
    expect(summary.netWorth).toBe(69_000);
  });

  it('converts mixed currencies into a base currency', () => {
    const convert = createConverter('INR', DEFAULT_USD_RATES);
    const summary = summarizeNetWorth(
      [
        {
          id: 'usd',
          name: 'US Checking',
          type: 'CURRENT',
          currency: 'USD',
          openingBalance: 100,
          entries: [],
        },
        {
          id: 'inr',
          name: 'HDFC',
          type: 'SAVINGS',
          currency: 'INR',
          openingBalance: 0,
          entries: [],
        },
      ],
      undefined,
      { baseCurrency: 'INR', convert },
    );
    expect(summary.baseCurrency).toBe('INR');
    expect(summary.assets).toBeCloseTo(100 * 84, 2);
    expect(summary.byAccount[0].contributionInBase).toBeCloseTo(8400, 2);
  });
});
