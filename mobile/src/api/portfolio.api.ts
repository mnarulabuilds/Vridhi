import { api } from './client';

export const PortfolioApi = {
  summary: async () =>
    (
      await api.get<{
        invested: number;
        marketValue: number;
        gain: number;
        gainPercent: number;
        allocation: Record<string, number>;
      }>('/portfolio/summary')
    ).data,
  list: async () => (await api.get('/portfolio')).data,
};
