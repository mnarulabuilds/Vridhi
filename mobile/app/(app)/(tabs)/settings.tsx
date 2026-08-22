import React, { useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SIZES } from '@/src/theme';
import { useAuth } from '@/src/providers/auth-provider';
import { useBiometrics } from '@/src/providers/biometric-provider';
import { useCategories } from '@/src/hooks/useCategories';
import { useBudgets } from '@/src/hooks/useBudgets';
import { useAccounts } from '@/src/hooks/useAccounts';
import PrimaryButton from '@/src/components/form/PrimaryButton';
import { monthBounds } from '@/src/utils/month';
import { ImportsApi } from '@/src/api/imports.api';
import { Switch } from 'react-native';

function parseCsv(text: string) {
  const lines = text.trim().split(/\r?\n/).filter(Boolean);
  const header = (lines[0] ?? '').split(',').map((cell) => cell.trim());
  const rows = lines.slice(1).map((line) => line.split(',').map((cell) => cell.trim()));
  return { header, rows };
}

function guessMapping(header: string[]) {
  const normalized = header.map((h) => h.toLowerCase());
  const find = (...keys: string[]) => header[normalized.findIndex((h) => keys.includes(h))];
  return {
    date: find('date', 'txn date', 'transaction date') ?? header[0],
    amount: find('amount', 'amt'),
    debit: find('debit', 'withdrawal', 'dr'),
    credit: find('credit', 'deposit', 'cr'),
    title: find('title', 'narration', 'description', 'particulars'),
    merchant: find('merchant', 'payee'),
  };
}

export default function SettingsScreen() {
  const { logout, user } = useAuth();
  const { biometrics, toggleBiometrics } = useBiometrics();
  const { categories, createCategory, archiveCategory } = useCategories();
  const { accounts } = useAccounts();
  const bounds = monthBounds(new Date());
  const { budgets, upsertBudget, saving } = useBudgets(bounds.periodStart);
  const [categoryName, setCategoryName] = useState('');
  const [csv, setCsv] = useState('');
  const [importAccountId, setImportAccountId] = useState('');
  const [importing, setImporting] = useState(false);
  const [budgetDraft, setBudgetDraft] = useState<Record<string, string>>({});

  const expenseCategories = useMemo(
    () => categories.filter((category) => category.type === 'EXPENSE'),
    [categories],
  );

  async function addCategory() {
    if (!categoryName.trim()) return;
    try {
      await createCategory({ name: categoryName.trim(), type: 'EXPENSE' });
      setCategoryName('');
    } catch (error: any) {
      Alert.alert('Error', error?.response?.data?.message ?? 'Could not create category');
    }
  }

  async function saveBudget(categoryId: string) {
    const amount = Number(budgetDraft[categoryId] ?? 0);
    const periodEnd = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toISOString();
    try {
      await upsertBudget({
        categoryId,
        amount,
        periodStart: bounds.periodStart,
        periodEnd,
      });
      Alert.alert('Saved', 'Budget updated');
    } catch (error: any) {
      Alert.alert('Error', error?.response?.data?.message ?? 'Could not save budget');
    }
  }

  async function importCsv() {
    const accountId = importAccountId || accounts[0]?.id;
    if (!accountId || !csv.trim()) {
      Alert.alert('Missing data', 'Paste a CSV and choose an account.');
      return;
    }
    const { header, rows } = parseCsv(csv);
    setImporting(true);
    try {
      const result = await ImportsApi.commit({
        accountId,
        header,
        rows,
        mapping: guessMapping(header),
      });
      Alert.alert(
        'Import complete',
        `Created ${result.created}, skipped ${result.skipped}, errors ${result.errors.length}`,
      );
      setCsv('');
    } catch (error: any) {
      Alert.alert('Import failed', error?.response?.data?.message ?? 'Could not import CSV');
    } finally {
      setImporting(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Settings</Text>
        <Text style={styles.muted}>{user?.email}</Text>

        <View style={styles.row}>
          <Text style={styles.label}>Unlock with biometrics</Text>
          <Switch value={biometrics} onValueChange={(value) => { void toggleBiometrics(value); }} />
        </View>

        <Text style={styles.section}>Categories</Text>
        <View style={styles.inline}>
          <TextInput
            style={styles.input}
            placeholder="New expense category"
            value={categoryName}
            onChangeText={setCategoryName}
          />
          <PrimaryButton title="Add" onPress={addCategory} />
        </View>
        {categories.map((category) => (
          <View key={category.id} style={styles.row}>
            <Text style={styles.label}>
              {category.name} · {category.type}
            </Text>
            <Text style={styles.link} onPress={() => archiveCategory(category.id)}>
              Archive
            </Text>
          </View>
        ))}

        <Text style={styles.section}>Monthly budgets</Text>
        {expenseCategories.map((category) => {
          const existing = budgets.find((budget) => budget.category.id === category.id);
          return (
            <View key={category.id} style={styles.budgetBlock}>
              <Text style={styles.label}>{category.name}</Text>
              <TextInput
                style={styles.input}
                keyboardType="decimal-pad"
                placeholder={existing ? String(existing.amount) : '0'}
                value={budgetDraft[category.id] ?? (existing ? String(existing.amount) : '')}
                onChangeText={(value) => setBudgetDraft((draft) => ({ ...draft, [category.id]: value }))}
              />
              <PrimaryButton title="Save" loading={saving} onPress={() => saveBudget(category.id)} />
            </View>
          );
        })}

        <Text style={styles.section}>CSV import</Text>
        <Text style={styles.muted}>Paste a bank CSV with a header row. Duplicates are skipped.</Text>
        {accounts.map((account) => (
          <Text
            key={account.id}
            style={[styles.account, importAccountId === account.id && styles.accountOn]}
            onPress={() => setImportAccountId(account.id)}
          >
            {account.name}
          </Text>
        ))}
        <TextInput
          style={styles.csv}
          multiline
          value={csv}
          onChangeText={setCsv}
          placeholder="date,amount,description"
        />
        <PrimaryButton title="Import CSV" loading={importing} onPress={importCsv} />

        <View style={{ height: 24 }} />
        <PrimaryButton title="Log out" onPress={logout} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  scroll: { padding: SIZES.padding, paddingBottom: 60 },
  title: { fontSize: 28, fontWeight: '800', color: COLORS.text },
  muted: { color: COLORS.textLight, marginBottom: 16 },
  section: { fontSize: 18, fontWeight: '700', marginTop: 24, marginBottom: 12, color: COLORS.text },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  label: { color: COLORS.text, flex: 1 },
  link: { color: COLORS.danger, fontWeight: '700' },
  inline: { gap: 10, marginBottom: 12 },
  input: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  budgetBlock: { marginBottom: 16 },
  csv: {
    minHeight: 120,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 12,
    marginVertical: 12,
    textAlignVertical: 'top',
  },
  account: { paddingVertical: 8, color: COLORS.textLight },
  accountOn: { color: COLORS.primary, fontWeight: '700' },
});
