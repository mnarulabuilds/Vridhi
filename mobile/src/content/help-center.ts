export type HelpArticle = {
  id: string;
  title: string;
  body: string;
};

export const FINANCIAL_TIPS: HelpArticle[] = [
  {
    id: 'tip-emergency',
    title: 'Build a 3–6 month emergency fund',
    body: 'Keep liquid cash in a dedicated savings account before chasing higher returns. Vridhi tracks this as a goal or a tagged account.',
  },
  {
    id: 'tip-budget',
    title: 'Budget by category, not by guilt',
    body: 'Set monthly limits in Settings → Budgets. Analytics shows planned vs spent so you can adjust before month-end.',
  },
  {
    id: 'tip-fx',
    title: 'Multi-currency accounts',
    body: 'Set a preferred currency in Profile for net worth and reports. Individual accounts and transactions keep their own currency.',
  },
  {
    id: 'tip-invest',
    title: 'Separate spending from investing',
    body: 'Use bank accounts for cash flow and the Portfolio screen (Pro) for holdings. Ask Vridhi compares both in one chat.',
  },
];

export const FAQ_ITEMS: HelpArticle[] = [
  {
    id: 'faq-net-worth',
    title: 'How is net worth calculated?',
    body: 'Assets minus liabilities across your accounts, converted to your preferred currency using live FX rates. Investment holdings in Portfolio are tracked separately until linked to net worth.',
  },
  {
    id: 'faq-bank',
    title: 'Can I link real bank accounts?',
    body: 'Yes. Settings → Link banks starts a secure connection flow. In development, a demo provider creates sample linked accounts; production uses regulated aggregators.',
  },
  {
    id: 'faq-kyc',
    title: 'Why verify identity (KYC)?',
    body: 'KYC unlocks bank linking and higher sync limits. Verification is automated in-app—no human reviewer—and typically completes in seconds when your details match.',
  },
  {
    id: 'faq-ai',
    title: 'What can Ask Vridhi answer?',
    body: 'Spending, budgets, net worth, balances, recurring bills, portfolio summary, and unusual patterns—all from your ledger. Open-ended chat uses a local or cloud model when configured.',
  },
  {
    id: 'faq-import',
    title: 'Import without bank link',
    body: 'Settings → CSV import maps bank exports into an account. Duplicates are skipped automatically.',
  },
];

export const RESOURCE_LINKS: Array<{ title: string; url: string; description: string }> = [
  {
    title: 'RBI — Safe digital banking',
    url: 'https://www.rbi.org.in/',
    description: 'Official guidance on regulated financial services in India.',
  },
  {
    title: 'SEBI investor education',
    url: 'https://investor.sebi.gov.in/',
    description: 'Basics on mutual funds, stocks, and investor protection.',
  },
  {
    title: 'Frankfurter FX (rates source)',
    url: 'https://www.frankfurter.app/',
    description: 'Indicative exchange rates used for multi-currency totals.',
  },
];
