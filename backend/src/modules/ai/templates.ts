export function formatMoney(amount: number, currency = 'INR') {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(amount) || 0);
}

export function formatPct(rate: number) {
  return `${(Number(rate) * 100).toFixed(1)}%`;
}

const CATEGORY_ALIASES: Record<string, string[]> = {
  grocery: ['groceries'],
  groceries: ['groceries'],
  food: ['dining', 'groceries'],
  eating: ['dining'],
  dining: ['dining'],
  restaurant: ['dining'],
  rent: ['rent/mortgage', 'rent'],
  mortgage: ['rent/mortgage'],
  fuel: ['transport'],
  petrol: ['transport'],
  uber: ['transport'],
  cab: ['transport'],
  transport: ['transport'],
  medical: ['health'],
  health: ['health'],
  shopping: ['shopping'],
  utilities: ['utilities'],
  electricity: ['utilities'],
};

export function matchCategory(
  spending: Record<string, number>,
  hint: string,
): { name: string; amount: number } | null {
  const needle = hint.trim().toLowerCase();
  if (!needle) return null;
  const entries = Object.entries(spending);
  const aliases = CATEGORY_ALIASES[needle] ?? [needle];

  for (const alias of aliases) {
    const exact = entries.find(([name]) => name.toLowerCase() === alias);
    if (exact) return { name: exact[0], amount: Number(exact[1]) };
  }
  for (const alias of aliases) {
    const partial = entries.find(
      ([name]) => name.toLowerCase().includes(alias) || alias.includes(name.toLowerCase()),
    );
    if (partial) return { name: partial[0], amount: Number(partial[1]) };
  }
  return null;
}

export interface SummarySnapshot {
  income: number;
  expenses: number;
  netCashFlow: number;
  savingsRate: number;
  spendingByCategory: Record<string, number>;
  budgetVsActual?: Array<{
    categoryName: string;
    planned: number;
    spent: number;
    remaining: number;
    utilization: number;
  }>;
  balances?: Array<{ name: string; balance: number; currency?: string }>;
}

export interface InsightNotice {
  title: string;
  detail: string;
}

export interface LedgerItem {
  title: string;
  amount: unknown;
  type: string;
  category?: { name: string } | null;
}

function topCategories(spending: Record<string, number>, currency: string) {
  return Object.entries(spending)
    .sort((a, b) => Number(b[1]) - Number(a[1]))
    .slice(0, 4)
    .map(([name, amount]) => `${name} ${formatMoney(Number(amount), currency)}`)
    .join(', ');
}

export function renderSummary(periodLabel: string, summary: SummarySnapshot, currency = 'INR') {
  const top = topCategories(summary.spendingByCategory ?? {}, currency);
  const lines = [
    `${periodLabel}: income ${formatMoney(summary.income, currency)}, expenses ${formatMoney(summary.expenses, currency)}.`,
    `Net cash flow ${formatMoney(summary.netCashFlow, currency)} · savings rate ${formatPct(summary.savingsRate)}.`,
  ];
  if (top) {
    lines.push(`Largest expense groups: ${top}.`);
  } else {
    lines.push('No expenses recorded in this period yet.');
  }
  return lines.join(' ');
}

export function renderCategorySpend(
  periodLabel: string,
  summary: SummarySnapshot,
  hint: string,
  currency = 'INR',
) {
  const match = matchCategory(summary.spendingByCategory ?? {}, hint);
  if (!match) {
    return `No recorded spend matching “${hint}” in ${periodLabel}.`;
  }
  const share = summary.expenses ? match.amount / summary.expenses : 0;
  return `${periodLabel}: ${formatMoney(match.amount, currency)} on ${match.name} (${formatPct(share)} of expenses).`;
}

export function renderBudgets(
  periodLabel: string,
  budgets: Array<{
    amount: unknown;
    category?: { name: string } | null;
  }>,
  summary: SummarySnapshot,
  currency = 'INR',
) {
  const rows = summary.budgetVsActual ?? [];
  if (rows.length === 0 && budgets.length === 0) {
    return `No budgets set for ${periodLabel}. Add one on Insights, then ask again.`;
  }
  const lines = (rows.length ? rows : budgets.map((budget) => ({
    categoryName: budget.category?.name ?? 'Category',
    planned: Number(budget.amount),
    spent: 0,
    remaining: Number(budget.amount),
    utilization: 0,
  }))).map((row) => {
    const used = formatPct(row.utilization);
    return `${row.categoryName}: spent ${formatMoney(row.spent, currency)} of ${formatMoney(row.planned, currency)} (${used} used, ${formatMoney(row.remaining, currency)} left)`;
  });
  return `${periodLabel} budgets — ${lines.join('; ')}.`;
}

export function renderBalances(
  accounts: Array<{ name: string; currentBalance?: number; currency?: string }>,
  summary: SummarySnapshot,
  currency = 'INR',
) {
  const rows =
    summary.balances?.length
      ? summary.balances
      : accounts.map((account) => ({
          name: account.name,
          balance: Number(account.currentBalance ?? 0),
          currency: account.currency,
        }));
  if (rows.length === 0) {
    return 'You have not added any accounts yet.';
  }
  const total = rows.reduce((sum, row) => sum + Number(row.balance), 0);
  const list = rows
    .map((row) => `${row.name} ${formatMoney(Number(row.balance), row.currency ?? currency)}`)
    .join(', ');
  return `Balances: ${list}. Combined ${formatMoney(total, currency)}.`;
}

export function renderInsights(periodLabel: string, notices: InsightNotice[]) {
  if (!notices.length) {
    return `No pattern notices for ${periodLabel} yet.`;
  }
  return `${periodLabel} — ${notices.map((notice) => `${notice.title}: ${notice.detail}`).join(' ')}`;
}

export function renderRecent(periodLabel: string, items: LedgerItem[], currency = 'INR') {
  if (!items.length) {
    return `No transactions recorded in ${periodLabel}.`;
  }
  const lines = items.slice(0, 8).map((item) => {
    const category = item.category?.name ? ` (${item.category.name})` : '';
    return `${item.title}${category} ${formatMoney(Number(item.amount), currency)}`;
  });
  return `Recent in ${periodLabel}: ${lines.join('; ')}.`;
}

export const FALLBACK_HELP =
  'I can answer from your recorded books without a language model: this month’s spending, savings rate, account balances, budgets, recent transactions, recurring bills, and unusual spend. For open chat, run Ollama locally (AI_PROVIDER=ollama) or set OPENAI_API_KEY.';
