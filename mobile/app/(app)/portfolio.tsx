import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import Screen from '@/src/components/common/Screen';
import EmptyState from '@/src/components/common/EmptyState';
import { PortfolioApi } from '@/src/api/portfolio.api';
import { formatCurrency } from '@/src/utils/currency';
import { COLORS } from '@/src/theme';

export default function PortfolioScreen() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['portfolio-summary'],
    queryFn: () => PortfolioApi.summary(),
    retry: false,
  });

  return (
    <Screen
      scroll
      title="Portfolio"
      breadcrumbs={[
        { label: 'Settings', href: '/settings' },
        { label: 'Portfolio' },
      ]}
      accessibilityLabel="Investment portfolio"
    >
      {isLoading ? (
        <ActivityIndicator color={COLORS.primary} />
      ) : error ? (
        <EmptyState
          title="Pro feature"
          message="Upgrade to Vridhi Pro to track investments and portfolio performance."
          actionLabel="View plans"
          onAction={() => router.push('/subscription')}
        />
      ) : (
        <>
          <Text style={styles.metric}>Market value {formatCurrency(data?.marketValue ?? 0)}</Text>
          <Text style={styles.sub}>
            Invested {formatCurrency(data?.invested ?? 0)} · Gain {formatCurrency(data?.gain ?? 0)} (
            {Math.round((data?.gainPercent ?? 0) * 100)}%)
          </Text>
        </>
      )}
      <TouchableOpacity onPress={() => refetch()} accessibilityRole="button">
        <Text style={styles.refresh}>Refresh</Text>
      </TouchableOpacity>
    </Screen>
  );
}

const styles = StyleSheet.create({
  metric: { fontSize: 24, fontWeight: '800', color: COLORS.text },
  sub: { color: COLORS.textLight, marginTop: 8 },
  refresh: { marginTop: 24, color: COLORS.primary, fontWeight: '700', textAlign: 'center' },
});
