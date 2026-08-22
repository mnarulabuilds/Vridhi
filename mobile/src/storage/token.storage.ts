import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

const ACCESS_TOKEN_KEY = 'vridhi_access_token';
const REFRESH_TOKEN_KEY = 'vridhi_refresh_token';

async function getItem(key: string) {
  try {
    if (Platform.OS === 'web') {
      return AsyncStorage.getItem(key);
    }
    return SecureStore.getItemAsync(key);
  } catch {
    return null;
  }
}

async function setItem(key: string, value: string) {
  if (Platform.OS === 'web') {
    await AsyncStorage.setItem(key, value);
    return;
  }
  await SecureStore.setItemAsync(key, value);
}

async function removeItem(key: string) {
  if (Platform.OS === 'web') {
    await AsyncStorage.removeItem(key);
    return;
  }
  await SecureStore.deleteItemAsync(key);
}

class TokenStorage {
  getAccessToken() {
    return getItem(ACCESS_TOKEN_KEY);
  }

  getRefreshToken() {
    return getItem(REFRESH_TOKEN_KEY);
  }

  async saveTokens(accessToken: string, refreshToken?: string) {
    await setItem(ACCESS_TOKEN_KEY, accessToken);
    if (refreshToken) {
      await setItem(REFRESH_TOKEN_KEY, refreshToken);
    }
  }

  async clear() {
    await Promise.all([removeItem(ACCESS_TOKEN_KEY), removeItem(REFRESH_TOKEN_KEY)]);
  }
}

export default new TokenStorage();
