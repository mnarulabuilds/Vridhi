import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOWS, SIZES } from '@/src/theme';
import PrimaryButton from '@/src/components/form/PrimaryButton';
import { useAccounts } from '@/src/hooks/useAccounts';
import { useCategories } from '@/src/hooks/useCategories';
import { useTransactions } from '@/src/hooks/useTransactions';
import { loadQuickAddPrefs, saveQuickAddPrefs } from '@/src/utils/quick-add-prefs';
import { useDebouncedValue } from '@/src/hooks/useDebouncedValue';
import { useCategorySuggestion } from '@/src/hooks/useCategorySuggestion';
import { confirmAlert } from '@/src/utils/confirmAlert';
import { formatCurrency } from '@/src/utils/currency';

type QuickType = 'EXPENSE' | 'INCOME';

export default function QuickAddTransactionScreen() {
  const { accounts, loading: accountsLoading } = useAccounts();
  const { categories } = useCategories();
  const { createTransaction, creating } = useTransactions();

  const [type, setType] = useState<QuickType>('EXPENSE');
  const [amount, setAmount] = useState('');
  const [title, setTitle] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [accountId, setAccountId] = useState('');

  const typeCategories = useMemo(
    () => categories.filter((category) => category.type === type && !category.isArchived),
    [categories, type],
  );

  useEffect(() => {
    let cancelled = false;
    void loadQuickAddPrefs().then((prefs) => {
      if (cancelled) return;
      if (prefs.accountId) setAccountId(prefs.accountId);
      if (prefs.categoryId) setCategoryId(prefs.categoryId);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!accountId && accounts[0]) {
      setAccountId(accounts[0].id);
    }
  }, [accounts, accountId]);

  useEffect(() => {
    if (!typeCategories.some((category) => category.id === categoryId)) {
      setCategoryId(typeCategories[0]?.id ?? '');
    }
  }, [typeCategories, categoryId]);

  const parsedAmount = Number(amount.replace(/,/g, ''));
  const selectedCategory = typeCategories.find((category) => category.id === categoryId);
  const canSave = parsedAmount > 0 && Boolean(accountId) && Boolean(categoryId);
  const debouncedTitle = useDebouncedValue(title, 280);
  const { data: suggestion } = useCategorySuggestion(debouncedTitle, type);

  useEffect(() => {
    if (!suggestion?.categoryId) return;
    if (typeCategories.some((category) => category.id === suggestion.categoryId)) {
      setCategoryId(suggestion.categoryId);
    }
  }, [suggestion?.categoryId, typeCategories]);

  async function save() {
    if (!canSave || creating) return;
    const label = title.trim() || selectedCategory?.name || (type === 'INCOME' ? 'Income' : 'Expense');
    try {
      await createTransaction({
        title: label,
        amount: parsedAmount,
        type,
        accountId,
        categoryId,
        merchant: title.trim() || undefined,
        transactionDate: new Date().toISOString(),
      });
      await saveQuickAddPrefs(accountId, categoryId);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch (error: unknown) {
      const message =
        error && typeof error === 'object' && 'response' in error
          ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      confirmAlert('Could not save', message ?? 'Unable to create transaction.');
    }
  }

  function moreDetails() {
    router.replace({
      pathname: '/transactions/create',
      params: {
        amount: parsedAmount > 0 ? String(parsedAmount) : '',
        type,
        categoryId,
        accountId,
        title,
      },
    });
  }

  if (accountsLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={COLORS.primary} />
      </View>
    );
  }

  if (accounts.length === 0) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <Text style={styles.headline}>Add an account first</Text>
        <Text style={styles.help}>Quick add needs somewhere to put the money.</Text>
        <PrimaryButton title="Create account" onPress={() => router.replace('/accounts/create')} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.handle} />
        <View style={styles.topRow}>
          <Text style={styles.headline}>Quick add</Text>
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <Ionicons name="close" size={24} color={COLORS.text} />
          </Pressable>
        </View>
        <Text style={styles.help}>Amount, category, save. Title is optional.</Text>

        <View style={styles.toggle}>
          {(['EXPENSE', 'INCOME'] as const).map((option) => (
            <Pressable
              key={option}
              onPress={() => setType(option)}
              style={[styles.toggleBtn, type === option && styles.toggleOn]}
            >
              <Text style={[styles.toggleText, type === option && styles.toggleTextOn]}>
                {option === 'EXPENSE' ? 'Expense' : 'Income'}
              </Text>
            </Pressable>
          ))}
        </View>

        <TextInput
          style={styles.amountInput}
          value={amount}
          onChangeText={setAmount}
          keyboardType="decimal-pad"
          placeholder="0"
          placeholderTextColor={COLORS.muted}
          autoFocus
        />
        <Text style={styles.amountHint}>
          {parsedAmount > 0 ? formatCurrency(parsedAmount) : 'Type the amount'}
        </Text>

        <Text style={styles.section}>Category</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chips}
          keyboardShouldPersistTaps="handled"
        >
          {typeCategories.map((category) => (
            <Pressable
              key={category.id}
              onPress={() => setCategoryId(category.id)}
              style={[styles.chip, categoryId === category.id && styles.chipOn]}
            >
              <Text style={[styles.chipText, categoryId === category.id && styles.chipTextOn]}>
                {category.name}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {accounts.length > 1 ? (
          <>
            <Text style={styles.section}>Account</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chips}
              keyboardShouldPersistTaps="handled"
            >
              {accounts.map((account) => (
                <Pressable
                  key={account.id}
                  onPress={() => setAccountId(account.id)}
                  style={[styles.chip, accountId === account.id && styles.chipOn]}
                >
                  <Text style={[styles.chipText, accountId === account.id && styles.chipTextOn]}>
                    {account.name}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </>
        ) : null}

        <TextInput
          style={styles.titleInput}
          value={title}
          onChangeText={setTitle}
          placeholder={selectedCategory ? selectedCategory.name : 'What’s it for? (optional)'}
          placeholderTextColor={COLORS.muted}
        />
        {suggestion?.categoryName ? (
          <Text style={styles.hint}>Using {suggestion.categoryName} because you used it for this before.</Text>
        ) : null}

        <PrimaryButton title="Save" loading={creating} disabled={!canSave} onPress={save} />
        <Pressable onPress={moreDetails} style={styles.more}>
          <Text style={styles.moreText}>More details</Text>
        </Pressable>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg, padding: SIZES.padding },
  flex: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 5,
    borderRadius: 3,
    backgroundColor: COLORS.border,
    marginBottom: 12,
  },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headline: { fontSize: 28, fontWeight: '800', color: COLORS.text },
  help: { color: COLORS.textLight, marginTop: 6, marginBottom: 16 },
  toggle: { flexDirection: 'row', backgroundColor: COLORS.surface, borderRadius: 16, padding: 4, ...SHADOWS.small },
  toggleBtn: { flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: 'center' },
  toggleOn: { backgroundColor: COLORS.primary },
  toggleText: { fontWeight: '700', color: COLORS.text },
  toggleTextOn: { color: '#fff' },
  amountInput: {
    fontSize: 40,
    fontWeight: '800',
    textAlign: 'center',
    paddingVertical: 8,
    color: COLORS.text,
    marginTop: 16,
  },
  amountHint: { textAlign: 'center', color: COLORS.textLight, marginBottom: 4 },
  section: { marginTop: 16, marginBottom: 8, fontWeight: '700', color: COLORS.text },
  chips: { gap: 8, paddingBottom: 4 },
  chip: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
  },
  chipOn: { backgroundColor: COLORS.primary },
  chipText: { fontWeight: '600', color: COLORS.text },
  chipTextOn: { color: '#fff' },
  titleInput: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 14,
    marginTop: 16,
    marginBottom: 16,
    color: COLORS.text,
  },
  more: { alignItems: 'center', paddingVertical: 16 },
  moreText: { color: COLORS.primary, fontWeight: '700' },
  hint: { color: COLORS.textLight, fontSize: 12, marginTop: -8, marginBottom: 12 },
});
