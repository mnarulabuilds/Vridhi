import { FAQ_ITEMS, FINANCIAL_TIPS, RESOURCE_LINKS } from './help-center';

describe('help-center content', () => {
  it('includes FAQs tips and resources', () => {
    expect(FAQ_ITEMS.length).toBeGreaterThan(2);
    expect(FINANCIAL_TIPS.length).toBeGreaterThan(2);
    expect(RESOURCE_LINKS.every((link) => link.url.startsWith('https://'))).toBe(true);
  });
});
