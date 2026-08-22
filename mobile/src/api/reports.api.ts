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
};
