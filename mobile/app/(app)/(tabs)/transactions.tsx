import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import TransactionCard from '@/src/components/transactions/TransactionCard';
import { TransactionType } from '@/src/api/transactions.api';
import { useTransactions } from '@/src/hooks/useTransactions';
import { useAccounts } from '@/src/hooks/useAccounts';
import { useDebouncedValue } from '@/src/hooks/useDebouncedValue';
import { useFinancialSummary } from '@/src/hooks/useFinancialSummary';
import { COLORS, SIZES } from '@/src/theme';
import FilterChips from '@/src/components/common/FilterChips';
import EmptyTransactions from '@/src/components/transactions/EmptyTransactions';
import FloatingActionButton from '@/src/components/common/FloatingActionButton';
import { formatCurrency } from '@/src/utils/currency';
import { monthBounds } from '@/src/utils/month';

const TYPE_FILTERS = [
  { label: 'All', value: 'ALL' },
  { label: 'Income', value: 'INCOME' },
  { label: 'Expense', value: 'EXPENSE' },
  { label: 'Transfer', value: 'TRANSFER' },
];

export default function TransactionsScreen() {
  const [search, setSearch] = useState('');
  const [type, setType] = useState('ALL');
  const [accountId, setAccountId] = useState('ALL');
  const [pulling, setPulling] = useState(false);
  const debouncedSearch = useDebouncedValue(search, 300);
  const { accounts } = useAccounts();
  const bounds = monthBounds(new Date());
  const { data: month } = useFinancialSummary(bounds.from, bounds.to);

  const query = useMemo(
    () => ({
      search: debouncedSearch.trim() || undefined,
      type: type === 'ALL' ? undefined : (type as TransactionType),
      accountId: accountId === 'ALL' ? undefined : accountId,
      limit: 50,
    }),
    [debouncedSearch, type, accountId],
  );

  const {
    transactions,
    isLoading,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useTransactions(query);

  const filtered = Boolean(debouncedSearch.trim() || type !== 'ALL' || accountId !== 'ALL');

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Transactions</Text>
        <View style={styles.monthRow}>
          <View style={styles.monthStat}>
            <Text style={styles.monthLabel}>In {bounds.label}</Text>
            <Text style={[styles.monthValue, { color: COLORS.success }]}>
              {formatCurrency(month?.income ?? 0)}
            </Text>
          </View>
          <View style={styles.monthStat}>
            <Text style={styles.monthLabel}>Spent</Text>
            <Text style={[styles.monthValue, { color: COLORS.danger }]}>
              {formatCurrency(month?.expenses ?? 0)}
            </Text>
          </View>
        </View>
        <TextInput
          placeholder="Search title, merchant, or category"
          value={search}
          onChangeText={setSearch}
          style={styles.search}
          autoCorrect={false}
          autoCapitalize="none"
          clearButtonMode="while-editing"
        />
        <FilterChips value={type} options={TYPE_FILTERS} onChange={setType} />
        {accounts.length > 1 ? (
          <FilterChips
            value={accountId}
            options={[
              { label: 'All accounts', value: 'ALL' },
              ...accounts.map((account) => ({ label: account.name, value: account.id })),
            ]}
            onChange={setAccountId}
          />
        ) : null}
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          style={styles.list}
          data={transactions}
          keyExtractor={(item) => item.id}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          refreshing={pulling}
          onRefresh={async () => {
            setPulling(true);
            try {
              await refetch();
            } finally {
              setPulling(false);
            }
          }}
          onEndReached={() => {
            if (hasNextPage && !isFetchingNextPage) void fetchNextPage();
          }}
          onEndReachedThreshold={0.4}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <TransactionCard
              transaction={item}
              onPress={() => router.push(`/transactions/${item.id}`)}
            />
          )}
          ListEmptyComponent={
            <EmptyTransactions
              title={filtered ? 'No matches' : 'No transactions yet'}
              subtitle={
                filtered
                  ? 'Try a different search or clear the filters.'
                  : 'Add your first income or expense with the + button.'
              }
            />
          }
          ListFooterComponent={
            isFetchingNextPage ? (
              <ActivityIndicator color={COLORS.primary} style={styles.more} />
            ) : null
          }
        />
      )}

      <FloatingActionButton onPress={() => router.push('/transactions/quick')} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    paddingHorizontal: SIZES.padding,
    paddingBottom: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.text,
    marginTop: 4,
  },
  monthRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
    marginBottom: 12,
  },
  monthStat: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  monthLabel: { color: COLORS.textLight, fontSize: 12 },
  monthValue: { fontWeight: '800', marginTop: 4, fontSize: 15 },
  search: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 4,
  },
  list: { flex: 1 },
  listContent: {
    paddingHorizontal: SIZES.padding,
    paddingTop: 8,
    paddingBottom: 120,
    flexGrow: 1,
  },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  more: { marginVertical: 16 },
});
