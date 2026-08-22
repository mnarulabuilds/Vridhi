import { api } from './client';
import { AuthenticatedUser } from '@/src/types/auth';

export interface UpdateProfileRequest {
  name?: string;
  preferredCurrency?: string;
  timezone?: string;
  locale?: string;
}

export const UsersApi = {
  update: async (payload: UpdateProfileRequest) =>
    (await api.patch<AuthenticatedUser>('/users/me', payload)).data,
  exportData: async () => (await api.get('/users/me/export')).data,
  deleteAccount: async (password: string) =>
    (await api.delete('/users/me', { data: { password } })).data,
};
