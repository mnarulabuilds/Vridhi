import { StubBankAggregator } from './stub-bank-aggregator';

describe('StubBankAggregator', () => {
  const aggregator = new StubBankAggregator();

  it('creates sessions and exchanges tokens', async () => {
    const session = await aggregator.createLinkSession('u1');
    expect(session.linkToken).toMatch(/^stub_/);
    const generated = await aggregator.exchangePublicToken('');
    expect(generated.externalItemId).toMatch(/^item_/);
    const item = await aggregator.exchangePublicToken('public');
    expect(item.institutionName).toBe('Demo Bank');
    const sync = await aggregator.syncTransactions(item.externalItemId);
    expect(sync.transactions).toEqual([]);
  });
});
