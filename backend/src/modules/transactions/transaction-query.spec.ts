import { buildTransactionWhere } from './transaction-query';
import { TransactionType } from './enum/transaction-type.enum';

describe('buildTransactionWhere', () => {
  it('scopes to the user accounts', () => {
    const where = buildTransactionWhere('u1', {});
    expect(where.AND).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          OR: [{ account: { userId: 'u1' } }, { transferToAccount: { userId: 'u1' } }],
        }),
      ]),
    );
  });

  it('applies filters', () => {
    const where = buildTransactionWhere('u1', {
      accountId: 'a1',
      categoryId: 'c1',
      type: TransactionType.EXPENSE,
      from: '2026-01-01',
      to: '2026-01-31',
      search: 'coffee',
    });
    const and = where.AND as object[];
    expect(and.length).toBeGreaterThan(4);
  });
});
