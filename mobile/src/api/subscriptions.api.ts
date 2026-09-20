import { api } from './client';

export const SubscriptionsApi = {
  me: async () =>
    (await api.get<{ plan: string; status: string; adsEnabled: boolean }>('/subscriptions/me')).data,
  upgrade: async () => (await api.post('/subscriptions/upgrade', {})).data,
  cancel: async () => (await api.post('/subscriptions/cancel', {})).data,
};
