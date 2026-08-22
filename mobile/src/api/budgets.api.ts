import { api } from './client';
import type { Category } from './categories.api';

export interface Budget { id: string; amount: number; periodStart: string; periodEnd: string; category: Category; }
export interface UpsertBudgetRequest { categoryId: string; amount: number; periodStart: string; periodEnd: string; }
export const BudgetsApi = {
  list: async (periodStart: string) => (await api.get<Budget[]>('/budgets', { params: { periodStart } })).data,
  upsert: async (payload: UpsertBudgetRequest) => (await api.put<Budget>('/budgets', payload)).data,
};
