import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const ACCESS_TOKEN_KEY = 'access_token_vridhi';

class TokenStorage {
  async getAccessToken(): Promise<string | null> {
    if (Platform.OS === 'web') {
      return AsyncStorage.getItem(ACCESS_TOKEN_KEY);
    }

    return SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
  }

  async setAccessToken(token: string): Promise<void> {
    if (Platform.OS === 'web') {
      await AsyncStorage.setItem(ACCESS_TOKEN_KEY, token);
      return;
    }

    await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, token);

  }

  async clearAccessToken(): Promise<void> {
    if (Platform.OS === 'web') {
      await AsyncStorage.removeItem(ACCESS_TOKEN_KEY);
      return;
    }

    await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
  }
}

export default new TokenStorage();