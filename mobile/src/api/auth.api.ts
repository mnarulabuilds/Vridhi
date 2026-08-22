import { AuthResponse, AuthenticatedUser } from '@/src/types/auth';
import { api } from './client';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

class AuthApi {
  async login(payload: LoginRequest): Promise<AuthResponse> {
    const { data } = await api.post<AuthResponse>('/auth/login', payload);
    return data;
  }

  async register(payload: RegisterRequest): Promise<AuthResponse> {
    const { data } = await api.post<AuthResponse>('/auth/register', payload);
    return data;
  }

  async refresh(refreshToken: string): Promise<AuthResponse> {
    const { data } = await api.post<AuthResponse>('/auth/refresh', { refreshToken });
    return data;
  }

  async logout(refreshToken: string): Promise<void> {
    await api.post('/auth/logout', { refreshToken });
  }

  async me(): Promise<AuthenticatedUser> {
    const { data } = await api.get<AuthenticatedUser>('/auth/me');
    return data;
  }

  async changePassword(payload: { currentPassword: string; newPassword: string }) {
    await api.post('/auth/change-password', payload);
  }

  async forgotPassword(email: string) {
    const { data } = await api.post<{ accepted: boolean; debugResetToken?: string }>(
      '/auth/forgot-password',
      { email },
    );
    return data;
  }

  async resetPassword(payload: { token: string; newPassword: string }) {
    await api.post('/auth/reset-password', payload);
  }
}

export default new AuthApi();
