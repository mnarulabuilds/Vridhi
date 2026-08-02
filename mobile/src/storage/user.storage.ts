import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthenticatedUser } from '@/src/types/auth';

const USER_KEY = '@vridhi_user';

class UserStorage {
  async getCurrentUser(): Promise<AuthenticatedUser | null> {
    try {
      const value = await AsyncStorage.getItem(USER_KEY);

      if (!value) {
        return null;
      }

      return JSON.parse(value) as AuthenticatedUser;
    } catch (error) {
      console.error(
        'Failed to read current user',
        error,
      );

      return null;
    }
  }

  async saveCurrentUser(
    user: AuthenticatedUser,
  ): Promise<void> {
    try {
      await AsyncStorage.setItem(
        USER_KEY,
        JSON.stringify(user),
      );
    } catch (error) {
      console.error(
        'Failed to save current user',
        error,
      );
    }
  }

  async removeCurrentUser(): Promise<void> {
    try {
      await AsyncStorage.removeItem(USER_KEY);
    } catch (error) {
      console.error(
        'Failed to remove current user',
        error,
      );
    }
  }

  async clear(): Promise<void> {
    await this.removeCurrentUser();
  }
}

export default new UserStorage();