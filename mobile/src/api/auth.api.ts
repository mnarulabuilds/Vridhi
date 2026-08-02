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
  async login(
    payload: LoginRequest,
  ): Promise<AuthResponse> {
    const { data } = await api.post<AuthResponse>(
      '/auth/login',
      payload,
    );

    return data;
  }

  async register(
    payload: RegisterRequest,
  ): Promise<AuthResponse> {
    const { data } = await api.post<AuthResponse>(
      '/auth/register',
      payload,
    );

    return data;
  }

  async me(): Promise<AuthenticatedUser> {
    const { data } =
      await api.get<AuthenticatedUser>(
        '/auth/me',
      );

    return data;
  }
}

export default new AuthApi();