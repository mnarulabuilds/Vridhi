import AsyncStorage from '@react-native-async-storage/async-storage';

const ACCESS_TOKEN_KEY = '@vridhi_access_token';

class TokenStorage {
  async getAccessToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(
        ACCESS_TOKEN_KEY,
      );
    } catch (error) {
      console.error(
        'Failed to read access token',
        error,
      );
      return null;
    }
  }

  async saveAccessToken(
    token: string,
  ): Promise<void> {
    try {
      await AsyncStorage.setItem(
        ACCESS_TOKEN_KEY,
        token,
      );
    } catch (error) {
      console.error(
        'Failed to save access token',
        error,
      );
    }
  }

  async removeAccessToken(): Promise<void> {
    try {
      await AsyncStorage.removeItem(
        ACCESS_TOKEN_KEY,
      );
    } catch (error) {
      console.error(
        'Failed to remove access token',
        error,
      );
    }
  }

  async clear(): Promise<void> {
    await this.removeAccessToken();
  }
}

export default new TokenStorage();