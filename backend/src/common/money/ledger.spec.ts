import { cashFlow, currentBalance, savingsRate, signedDeltaForAccount } from './ledger';

describe('ledger math', () => {
  const income = { type: 'INCOME' as const, amount: 1000, accountId: 'a' };
  const expense = { type: 'EXPENSE' as const, amount: 200, accountId: 'a' };
  const transferOut = {
    type: 'TRANSFER' as const,
    amount: 150,
    accountId: 'a',
    transferToAccountId: 'b',
  };

  it('adds income and subtracts expenses on the owning account', () => {
    expect(signedDeltaForAccount(income, 'a')).toBe(1000);
    expect(signedDeltaForAccount(expense, 'a')).toBe(-200);
  });

  it('moves transfer amounts between accounts without treating them as expenses', () => {
    expect(signedDeltaForAccount(transferOut, 'a')).toBe(-150);
    expect(signedDeltaForAccount(transferOut, 'b')).toBe(150);
    expect(cashFlow([income, expense, transferOut])).toEqual({ income: 1000, expenses: 200 });
  });

  it('computes current balance and savings rate', () => {
    expect(currentBalance(50, [income, expense, transferOut], 'a')).toBe(700);
    expect(currentBalance(0, [transferOut], 'b')).toBe(150);
    expect(savingsRate(1000, 200)).toBeCloseTo(0.8);
    expect(savingsRate(0, 10)).toBe(0);
  });
});
