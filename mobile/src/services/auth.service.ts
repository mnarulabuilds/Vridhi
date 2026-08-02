import AuthApi, {
  LoginRequest,
} from '../api/auth.api';

import TokenStorage from '../storage/token.storage';
import UserStorage from '../storage/user.storage';

class AuthService {
  async login(payload: LoginRequest) {
    const response = await AuthApi.login(payload);

    await TokenStorage.setAccessToken(
      response.data.accessToken,
    );

    await UserStorage.save(response.data.user);

    return response.data;
  }

  async logout() {
    await TokenStorage.clearAccessToken();
    await UserStorage.clear();
  }

  async getAccessToken() {
    return TokenStorage.getAccessToken();
  }

  async getCurrentUser() {
    return UserStorage.get();
  }
}

export default new AuthService();