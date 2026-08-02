import React from 'react';

import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';

import { router } from 'expo-router';

import { useAccounts } from '@/src/hooks/useAccounts';

import {
  COLORS,
  SHADOWS,
  SIZES,
} from '@/src/theme';
import AccountCard from '@/src/components/accounts/AccountCard';
import AccountsSummary from '@/src/components/accounts/AccountsSummary';

export default function AccountsScreen() {
  const {
    accounts,
    loading,
    refreshing,
    refetch,
  } = useAccounts();

  const activeAccounts = accounts.filter(
    account => !account.isArchived,
  );

  const totalAssets = activeAccounts.reduce((acc, account) => {
    const currency = account.currency;

    acc[currency] =
      (acc[currency] ?? 0) +
      Number(account.openingBalance);

    return acc;
  }, {} as Record<string, number>);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator
          size="large"
          color={COLORS.primary}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={accounts}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refetch}
          />
        }
        ListHeaderComponent={() => (
          <>
            <AccountsSummary
              totalAssets={totalAssets}
              accountCount={activeAccounts.length}
            />

            <Text style={styles.title}>
              Accounts
            </Text>

            <Text style={styles.subtitle}>
              Manage your bank accounts,
              wallets and investments.
            </Text>
          </>
        )}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Ionicons
              name="wallet-outline"
              size={72}
              color={COLORS.textLight}
            />

            <Text style={styles.emptyTitle}>
              No Accounts Yet
            </Text>

            <Text style={styles.emptySubtitle}>
              Create your first account to
              start tracking your finances.
            </Text>
          </View>
        )}
        renderItem={({ item }) => (
          <AccountCard
            account={item}
            onPress={() => router.push(`/accounts/${item.id}`)}
          />
        )}
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() =>
          router.push('/accounts/create')
        }
      >
        <Ionicons
          name="add"
          size={30}
          color="#fff"
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },

  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.bg,
  },

  content: {
    padding: SIZES.padding,
    paddingBottom: 120,
  },

  title: {
    fontSize: 30,
    fontWeight: '700',
    color: COLORS.text,
  },

  subtitle: {
    marginTop: 6,
    marginBottom: 28,
    color: COLORS.textLight,
    fontSize: 15,
  },

  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    marginBottom: 16,
    borderRadius: 18,
    backgroundColor: COLORS.surface,
    ...SHADOWS.medium,
  },

  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
  },

  info: {
    flex: 1,
    marginLeft: 16,
  },

  name: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },

  type: {
    marginTop: 4,
    color: COLORS.textLight,
    textTransform: 'capitalize',
  },

  balanceContainer: {
    alignItems: 'flex-end',
  },

  balance: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.primary,
  },

  emptyContainer: {
    marginTop: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },

  emptyTitle: {
    marginTop: 18,
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.text,
  },

  emptySubtitle: {
    marginTop: 10,
    textAlign: 'center',
    color: COLORS.textLight,
    paddingHorizontal: 24,
  },

  fab: {
    position: 'absolute',
    right: 24,
    bottom: 30,
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    ...SHADOWS.large,
  },
});