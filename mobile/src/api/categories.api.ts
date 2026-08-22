import { api } from './client';

export type CategoryType = 'INCOME' | 'EXPENSE' | 'TRANSFER';
export interface Category { id: string; name: string; type: CategoryType; color?: string | null; icon?: string | null; isArchived: boolean; }
export interface CreateCategoryRequest { name: string; type: CategoryType; color?: string; icon?: string; }

export const CategoriesApi = {
  list: async () => (await api.get<Category[]>('/categories')).data,
  create: async (payload: CreateCategoryRequest) => (await api.post<Category>('/categories', payload)).data,
  archive: async (id: string) => (await api.delete<Category>(`/categories/${id}`)).data,
};
