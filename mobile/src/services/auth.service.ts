import AuthApi, {
  LoginRequest,
  RegisterRequest,
} from '@/src/api/auth.api';

import TokenStorage from '@/src/storage/token.storage';
import UserStorage from '@/src/storage/user.storage';

import {
  AuthenticatedUser,
  AuthResponse,
} from '@/src/types/auth';

class AuthService {
  /**
   * Login user
   */
  async login(
    payload: LoginRequest,
  ): Promise<AuthResponse> {
    const response =
      await AuthApi.login(payload);

    await Promise.all([
      TokenStorage.saveAccessToken(
        response.accessToken,
      ),
      UserStorage.saveCurrentUser(
        response.user,
      ),
    ]);

    return response;
  }

  /**
   * Register user
   */
  async register(
    payload: RegisterRequest,
  ): Promise<AuthResponse> {
    const response =
      await AuthApi.register(payload);

    await Promise.all([
      TokenStorage.saveAccessToken(
        response.accessToken,
      ),
      UserStorage.saveCurrentUser(
        response.user,
      ),
    ]);

    return response;
  }

  /**
   * Restore JWT
   */
  async getAccessToken(): Promise<string | null> {
    return TokenStorage.getAccessToken();
  }

  /**
   * Restore logged in user
   */
  async getCurrentUser(): Promise<AuthenticatedUser | null> {
    return UserStorage.getCurrentUser();
  }

  /**
   * Refresh user from backend
   */
  async me(): Promise<AuthenticatedUser> {
    const user = await AuthApi.me();

    await UserStorage.saveCurrentUser(
      user,
    );

    return user;
  }

  /**
   * Logout
   */
  async logout(): Promise<void> {
    await Promise.all([
      TokenStorage.clear(),
      UserStorage.clear(),
    ]);
  }

  /**
   * Clear everything
   */
  async clearSession(): Promise<void> {
    await this.logout();
  }
}

export default new AuthService();