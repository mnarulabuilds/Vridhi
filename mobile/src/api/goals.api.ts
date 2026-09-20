import { api } from './client';

export const GoalsApi = {
  list: async () => (await api.get('/goals')).data,
  upsert: async (payload: Record<string, unknown>) => (await api.post('/goals', payload)).data,
};
