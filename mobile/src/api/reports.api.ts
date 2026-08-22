import { api } from './client';
export interface FinancialSummary { from: string; to: string; income: number; expenses: number; netCashFlow: number; savingsRate: number; spendingByCategory: Record<string, number>; balances: Array<{ accountId: string; currency: string; balance: number }>; }
export const ReportsApi = { summary: async (from: string, to: string) => (await api.get<FinancialSummary>('/reports/summary', { params: { from, to } })).data };
