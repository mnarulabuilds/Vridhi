import AsyncStorage from '@react-native-async-storage/async-storage';

const USER_KEY = 'authenticated_user_vridhi';

export interface AuthenticatedUser {
  id: string;
  name: string;
  email: string;
}

class UserStorage {
  async save(user: AuthenticatedUser): Promise<void> {
    await AsyncStorage.setItem(
      USER_KEY,
      JSON.stringify(user),
    );
  }

  async get(): Promise<AuthenticatedUser | null> {
    const value = await AsyncStorage.getItem(USER_KEY);

    if (!value) {
      return null;
    }

    return JSON.parse(value);
  }

  async clear(): Promise<void> {
    await AsyncStorage.removeItem(USER_KEY);
  }
}

export default new UserStorage();