export interface LedgerTxn {
  title: string;
  merchant?: string | null;
  amount: number;
  type: 'INCOME' | 'EXPENSE' | 'TRANSFER';
  categoryName: string | null;
  transactionDate: Date;
}

export interface InsightNotice {
  kind: 'recurring' | 'unusual' | 'trend' | 'info';
  severity: 'info' | 'warning' | 'good';
  title: string;
  detail: string;
}

export function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

export function normalizeLabel(value: string): string {
  return value
    .toLowerCase()
    .replace(/\d+/g, '')
    .replace(/[^a-z\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function cashFlowByMonth(transactions: LedgerTxn[]): Array<{
  month: string;
  income: number;
  expenses: number;
  savingsRate: number;
}> {
  const buckets = new Map<string, { income: number; expenses: number }>();
  for (const txn of transactions) {
    const key = monthKey(txn.transactionDate);
    const bucket = buckets.get(key) ?? { income: 0, expenses: 0 };
    const amount = Number(txn.amount);
    if (txn.type === 'INCOME') bucket.income += amount;
    if (txn.type === 'EXPENSE') bucket.expenses += amount;
    buckets.set(key, bucket);
  }
  return [...buckets.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, { income, expenses }]) => ({
      month,
      income,
      expenses,
      savingsRate: income ? (income - expenses) / income : 0,
    }));
}

export function detectRecurring(transactions: LedgerTxn[]): Array<{
  label: string;
  categoryName: string | null;
  typicalAmount: number;
  monthsSeen: number;
}> {
  const groups = new Map<string, { amounts: number[]; months: Set<string>; label: string; categoryName: string | null }>();
  for (const txn of transactions) {
    if (txn.type !== 'EXPENSE') continue;
    const raw = txn.merchant || txn.title;
    const label = normalizeLabel(raw);
    if (label.length < 3) continue;
    const key = `${txn.categoryName ?? 'other'}|${label}`;
    const group = groups.get(key) ?? {
      amounts: [],
      months: new Set<string>(),
      label: raw.trim(),
      categoryName: txn.categoryName,
    };
    group.amounts.push(Number(txn.amount));
    group.months.add(monthKey(txn.transactionDate));
    groups.set(key, group);
  }

  const recurring: Array<{
    label: string;
    categoryName: string | null;
    typicalAmount: number;
    monthsSeen: number;
  }> = [];
  for (const group of groups.values()) {
    if (group.months.size < 3) continue;
    const mean = group.amounts.reduce((sum, n) => sum + n, 0) / group.amounts.length;
    const spread = Math.max(...group.amounts) - Math.min(...group.amounts);
    if (mean <= 0 || spread / mean > 0.4) continue;
    recurring.push({
      label: group.label,
      categoryName: group.categoryName,
      typicalAmount: Math.round(mean * 100) / 100,
      monthsSeen: group.months.size,
    });
  }
  return recurring.sort((a, b) => b.typicalAmount - a.typicalAmount).slice(0, 8);
}

export function detectUnusualCategories(
  transactions: LedgerTxn[],
  focusMonth: string,
): Array<{ categoryName: string; thisMonth: number; average: number; ratio: number }> {
  const byMonth = new Map<string, Map<string, number>>();
  for (const txn of transactions) {
    if (txn.type !== 'EXPENSE') continue;
    const month = monthKey(txn.transactionDate);
    const category = txn.categoryName ?? 'Uncategorized';
    const cats = byMonth.get(month) ?? new Map<string, number>();
    cats.set(category, (cats.get(category) ?? 0) + Number(txn.amount));
    byMonth.set(month, cats);
  }
  const priorMonths = [...byMonth.keys()].filter((key) => key < focusMonth).sort();
  const recentPrior = priorMonths.slice(-6);
  if (recentPrior.length < 2) return [];
  const focus = byMonth.get(focusMonth) ?? new Map<string, number>();
  const unusual: Array<{ categoryName: string; thisMonth: number; average: number; ratio: number }> = [];
  for (const [category, thisMonth] of focus.entries()) {
    const history = recentPrior.map((month) => byMonth.get(month)?.get(category) ?? 0);
    const average = history.reduce((sum, n) => sum + n, 0) / history.length;
    if (average < 200 || thisMonth < 500) continue;
    const ratio = thisMonth / average;
    if (ratio >= 1.5) {
      unusual.push({
        categoryName: category,
        thisMonth: Math.round(thisMonth * 100) / 100,
        average: Math.round(average * 100) / 100,
        ratio: Math.round(ratio * 100) / 100,
      });
    }
  }
  return unusual.sort((a, b) => b.ratio - a.ratio).slice(0, 6);
}

export function buildNotices(input: {
  focusMonth: string;
  recurring: ReturnType<typeof detectRecurring>;
  unusual: ReturnType<typeof detectUnusualCategories>;
  savingsRateByMonth: ReturnType<typeof cashFlowByMonth>;
}): InsightNotice[] {
  const notices: InsightNotice[] = [];
  const trend = input.savingsRateByMonth.filter((row) => row.month <= input.focusMonth);
  const current = trend.find((row) => row.month === input.focusMonth);
  const prior = trend.filter((row) => row.month < input.focusMonth).slice(-3);
  if (current && prior.length >= 2) {
    const priorAvg = prior.reduce((sum, row) => sum + row.savingsRate, 0) / prior.length;
    const delta = current.savingsRate - priorAvg;
    if (delta <= -0.1) {
      notices.push({
        kind: 'trend',
        severity: 'warning',
        title: 'You are saving less than recently',
        detail: `Savings rate is ${(current.savingsRate * 100).toFixed(0)}% this month vs ${(priorAvg * 100).toFixed(0)}% over the previous ${prior.length} months.`,
      });
    } else if (delta >= 0.1) {
      notices.push({
        kind: 'trend',
        severity: 'good',
        title: 'You are saving more than recently',
        detail: `Savings rate is ${(current.savingsRate * 100).toFixed(0)}% this month vs ${(priorAvg * 100).toFixed(0)}% over the previous ${prior.length} months.`,
      });
    }
  }

  for (const item of input.unusual.slice(0, 3)) {
    notices.push({
      kind: 'unusual',
      severity: 'warning',
      title: `${item.categoryName} is higher than usual`,
      detail: `₹${item.thisMonth.toLocaleString('en-IN')} this month vs about ₹${item.average.toLocaleString('en-IN')} in recent months.`,
    });
  }

  for (const item of input.recurring.slice(0, 3)) {
    const category = item.categoryName ? ` (${item.categoryName})` : '';
    notices.push({
      kind: 'recurring',
      severity: 'info',
      title: `${item.label} looks regular${category}`,
      detail: `About ₹${item.typicalAmount.toLocaleString('en-IN')} across ${item.monthsSeen} months. Treat this as a planned cost, not a one-off.`,
    });
  }

  if (notices.length === 0) {
    notices.push({
      kind: 'info',
      severity: 'info',
      title: 'Not enough history for patterns yet',
      detail: 'Log a few months of income and expenses. Vridhi will then point out regular bills and unusual spikes.',
    });
  }

  return notices.slice(0, 6);
}
