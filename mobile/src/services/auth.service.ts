import AuthApi, { LoginRequest, RegisterRequest } from '@/src/api/auth.api';
import TokenStorage from '@/src/storage/token.storage';
import UserStorage from '@/src/storage/user.storage';
import { AuthenticatedUser, AuthResponse } from '@/src/types/auth';

class AuthService {
  private async persist(response: AuthResponse) {
    await Promise.all([
      TokenStorage.saveTokens(response.accessToken, response.refreshToken),
      UserStorage.saveCurrentUser(response.user),
    ]);
    return response;
  }

  login(payload: LoginRequest) {
    return AuthApi.login(payload).then((response) => this.persist(response));
  }

  register(payload: RegisterRequest) {
    return AuthApi.register(payload).then((response) => this.persist(response));
  }

  getAccessToken() {
    return TokenStorage.getAccessToken();
  }

  getCurrentUser() {
    return UserStorage.getCurrentUser();
  }

  async me(): Promise<AuthenticatedUser> {
    const user = await AuthApi.me();
    await UserStorage.saveCurrentUser(user);
    return user;
  }

  async logout() {
    const refreshToken = await TokenStorage.getRefreshToken();
    try {
      if (refreshToken) {
        await AuthApi.logout(refreshToken);
      }
    } catch {
      // still clear local session
    }
    await Promise.all([TokenStorage.clear(), UserStorage.clear()]);
  }

  clearSession() {
    return this.logout();
  }
}

export default new AuthService();
