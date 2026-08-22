import AsyncStorage from '@react-native-async-storage/async-storage';

const ACCOUNT_KEY = 'vridhi.quickAdd.accountId';
const CATEGORY_KEY = 'vridhi.quickAdd.categoryId';

export async function loadQuickAddPrefs() {
  const [accountId, categoryId] = await Promise.all([
    AsyncStorage.getItem(ACCOUNT_KEY),
    AsyncStorage.getItem(CATEGORY_KEY),
  ]);
  return { accountId, categoryId };
}

export async function saveQuickAddPrefs(accountId: string, categoryId: string) {
  await Promise.all([
    AsyncStorage.setItem(ACCOUNT_KEY, accountId),
    AsyncStorage.setItem(CATEGORY_KEY, categoryId),
  ]);
}
