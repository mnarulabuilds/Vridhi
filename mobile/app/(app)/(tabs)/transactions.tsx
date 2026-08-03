import React, { useMemo, useState } from 'react';

import {
  FlatList,
  StyleSheet,
  Text,
  TextInput,
} from 'react-native';

import { router } from 'expo-router';


import TransactionSummary from '@/src/components/transactions/TransactionSummary';
import TransactionCard from '@/src/components/transactions/TransactionCard';

import { useTransactions } from '@/src/hooks/useTransactions';

import { COLORS } from '@/src/theme';
import ScreenContainer from '@/src/components/ScreenContainer';
import FilterChips from '@/src/components/common/FilterChips';
import EmptyTransactions from '@/src/components/transactions/EmptyTransactions';
import FloatingActionButton from '@/src/components/common/FloatingActionButton';

const FILTERS = [
  { label: 'All', value: 'ALL' },
  { label: 'Income', value: 'INCOME' },
  { label: 'Expense', value: 'EXPENSE' },
  { label: 'Transfer', value: 'TRANSFER' },
];

export default function TransactionsScreen() {
  const {
    transactions,
    refetch,
    isFetching,
  } = useTransactions();

  const [query, setQuery] = useState('');
  const [filter, setFilter] =
    useState('ALL');

  const filteredTransactions =
    useMemo(() => {
      return transactions.filter(t => {
        const matchesSearch =
          t.title
            .toLowerCase()
            .includes(query.toLowerCase()) ||
          t.category
            .toLowerCase()
            .includes(query.toLowerCase()) ||
          t.merchant
            ?.toLowerCase()
            .includes(query.toLowerCase());

        const matchesFilter =
          filter === 'ALL'
            ? true
            : t.type === filter;

        return (
          matchesSearch &&
          matchesFilter
        );
      });
    }, [
      transactions,
      query,
      filter,
    ]);

  const income =
    filteredTransactions
      .filter(
        t => t.type === 'INCOME',
      )
      .reduce(
        (sum, t) =>
          sum + Number(t.amount),
        0,
      );

  const expense =
    filteredTransactions
      .filter(
        t => t.type === 'EXPENSE',
      )
      .reduce(
        (sum, t) =>
          sum + Number(t.amount),
        0,
      );

  return (
    <ScreenContainer
      title="Transactions"
      scrollable
    >

      <FilterChips
        value={filter}
        options={FILTERS}
        onChange={setFilter}
      />

      <FlatList
        data={filteredTransactions}
        keyExtractor={item => item.id}
        refreshing={isFetching}
        onRefresh={refetch}
        ListHeaderComponent={
          <>
            <TransactionSummary
              income={income}
              expense={expense}
            />

            <TextInput
              placeholder="Search transactions..."
              value={query}
              onChangeText={setQuery}
              style={styles.search}
            />

            <Text
              style={styles.heading}
            >
              Recent Activity
            </Text>
          </>
        }
        renderItem={({ item }) => (
          <TransactionCard
            transaction={item}
            onPress={() =>
              router.push(
                `/transactions/${item.id}`,
              )
            }
          />
        )}
        ListEmptyComponent={
          <EmptyTransactions
          />
        }
      />

      <FloatingActionButton
        onPress={() =>
          router.push(
            '/transactions/create',
          )
        }
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  search: {
    backgroundColor: '#fff',

    borderRadius: 14,

    paddingHorizontal: 16,

    paddingVertical: 14,

    marginBottom: 18,
  },

  heading: {
    fontSize: 18,

    fontWeight: '700',

    marginBottom: 14,

    color: COLORS.text,
  },

  empty: {
    textAlign: 'center',

    marginTop: 60,

    color: COLORS.textLight,
  },
});