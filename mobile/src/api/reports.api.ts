import { api } from './client';

export interface FinancialSummary {
  from: string;
  to: string;
  income: number;
  expenses: number;
  netCashFlow: number;
  savingsRate: number;
  spendingByCategory: Record<string, number>;
  budgetVsActual: Array<{
    categoryId: string;
    categoryName: string;
    planned: number;
    spent: number;
    remaining: number;
    utilization: number;
  }>;
  balances: Array<{ accountId: string; name?: string; currency: string; balance: number }>;
}

export const ReportsApi = {
  summary: async (from: string, to: string) =>
    (await api.get<FinancialSummary>('/reports/summary', { params: { from, to } })).data,
  insights: async (asOf: string) =>
    (await api.get<InsightsReport>('/reports/insights', { params: { asOf } })).data,
};

export interface InsightNotice {
  kind: 'recurring' | 'unusual' | 'trend' | 'info';
  severity: 'info' | 'warning' | 'good';
  title: string;
  detail: string;
}

export interface InsightsReport {
  asOf: string;
  focusMonth: string;
  notices: InsightNotice[];
  recurring: Array<{ label: string; categoryName: string | null; typicalAmount: number; monthsSeen: number }>;
  unusualCategories: Array<{ categoryName: string; thisMonth: number; average: number; ratio: number }>;
  savingsRateByMonth: Array<{ month: string; income: number; expenses: number; savingsRate: number }>;
}
