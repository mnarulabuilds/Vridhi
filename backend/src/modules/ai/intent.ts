export type IntentKind =
  | 'summary'
  | 'insights'
  | 'budgets'
  | 'balances'
  | 'category_spend'
  | 'recent'
  | 'unknown';

export interface ClassifiedIntent {
  kind: IntentKind;
  from: string;
  to: string;
  asOf: string;
  periodLabel: string;
  categoryHint?: string;
}

const MONTH_INDEX: Record<string, number> = {
  january: 0,
  jan: 0,
  february: 1,
  feb: 1,
  march: 2,
  mar: 2,
  april: 3,
  apr: 3,
  may: 4,
  june: 5,
  jun: 5,
  july: 6,
  jul: 6,
  august: 7,
  aug: 7,
  september: 8,
  sep: 8,
  sept: 8,
  october: 9,
  oct: 9,
  november: 10,
  nov: 10,
  december: 11,
  dec: 11,
};

export function monthBounds(year: number, month: number) {
  const from = new Date(year, month, 1);
  const to = new Date(year, month + 1, 0, 23, 59, 59, 999);
  return {
    from: from.toISOString(),
    to: to.toISOString(),
    asOf: from.toISOString(),
    periodLabel: from.toLocaleString('en-IN', { month: 'long', year: 'numeric' }),
  };
}

export function parsePeriod(text: string, now = new Date()) {
  const t = text.toLowerCase();
  let year = now.getFullYear();
  let month = now.getMonth();

  if (/\b(last|previous)\s+month\b|\bpichle\s+mahine\b/.test(t)) {
    month -= 1;
    if (month < 0) {
      month = 11;
      year -= 1;
    }
    return monthBounds(year, month);
  }

  const yearMatch = t.match(/\b(20\d{2})\b/);
  if (yearMatch) {
    year = Number(yearMatch[1]);
  }

  for (const [name, index] of Object.entries(MONTH_INDEX)) {
    if (new RegExp(`\\b${name}\\b`, 'i').test(t)) {
      month = index;
      if (!yearMatch && index > now.getMonth()) {
        year = now.getFullYear() - 1;
      }
      return monthBounds(year, month);
    }
  }

  return monthBounds(now.getFullYear(), now.getMonth());
}

function cleanCategoryHint(raw: string) {
  return raw
    .toLowerCase()
    .replace(/\b(this|last|previous|month|in|during|the|my|a|an)\b/g, ' ')
    .replace(/[?.!,]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractCategoryHint(text: string): string | undefined {
  const patterns = [
    /\b(?:spent|spend|spending|expenses?|kharcha)\s+(?:on|for)\s+([a-zA-Z][a-zA-Z\s/'-]{1,40})/i,
    /\bhow much(?:\s+did i(?:\s+\w+)?)?\s+on\s+([a-zA-Z][a-zA-Z\s/'-]{1,40})/i,
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (!match?.[1]) continue;
    const hint = cleanCategoryHint(match[1]);
    if (hint.length >= 2 && !/^(this|last|month|it|that)$/.test(hint)) {
      return hint;
    }
  }
  return undefined;
}

export function classifyIntent(message: string, now = new Date()): ClassifiedIntent {
  const text = message.trim();
  const period = parsePeriod(text, now);
  const base = { ...period };

  if (
    /\b(unusual|recurring|repeat(?:ing)? bills?|bills? (?:that )?repeat|what changed|pattern|spike|regular bills?)\b/i.test(
      text,
    )
  ) {
    return { kind: 'insights', ...base };
  }

  if (/\b(budget|overspent|over budget|left in .* budget|utilization)\b/i.test(text)) {
    return { kind: 'budgets', ...base };
  }

  if (
    /\b(balances?|how much do i have|net worth|across accounts|account totals?)\b/i.test(text)
  ) {
    return { kind: 'balances', ...base };
  }

  if (/\b(recent transactions?|latest (?:transactions?|expenses?)|last (?:few )?expenses?)\b/i.test(text)) {
    return { kind: 'recent', ...base };
  }

  const categoryHint = extractCategoryHint(text);
  if (
    categoryHint &&
    /\b(spend|spent|spending|expenses?|how much|kharcha|bill)\b/i.test(text)
  ) {
    return { kind: 'category_spend', categoryHint, ...base };
  }

  if (
    /\b(how much|spend|spent|spending|expenses?|income|savings rate|cash flow|this month|kitna kharcha)\b/i.test(
      text,
    )
  ) {
    return { kind: 'summary', ...base };
  }

  return { kind: 'unknown', ...base };
}
