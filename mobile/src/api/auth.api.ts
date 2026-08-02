import { api } from './client';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

class AuthApi {
  login(payload: LoginRequest) {
    return api.post<LoginResponse>(
      '/auth/login',
      payload,
    );
  }
}

export default new AuthApi();