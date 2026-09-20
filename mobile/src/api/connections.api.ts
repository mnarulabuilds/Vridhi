import { api } from './client';

export interface FinancialConnection {
  id: string;
  institutionName: string | null;
  status: string;
  lastSyncedAt: string | null;
  lastError: string | null;
}

export const ConnectionsApi = {
  list: async () => (await api.get<FinancialConnection[]>('/connections')).data,
  createLinkSession: async () =>
    (await api.post<{ linkToken: string; expiresAt: string }>('/connections/link-session')).data,
  complete: async (publicToken: string) =>
    (await api.post<FinancialConnection>('/connections/complete', { publicToken })).data,
  sync: async (connectionId: string) =>
    (await api.post<FinancialConnection>(`/connections/${connectionId}/sync`)).data,
};
