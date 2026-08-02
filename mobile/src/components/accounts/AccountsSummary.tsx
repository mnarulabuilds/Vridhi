import React from 'react';

import {
  StyleSheet,
  Text,
} from 'react-native';

import { LinearGradient } from 'expo-linear-gradient';

import {
  COLORS,
  SHADOWS,
} from '@/src/theme';

import { formatCurrency } from '@/src/utils/currency';

interface Props {
  totalAssets: Record<string, number>;
  accountCount: number;
}

export default function AccountsSummary({
  totalAssets,
  accountCount,
}: Props) {
  return (
    <LinearGradient
      colors={[
        COLORS.primary,
        COLORS.primaryDark,
      ]}
      style={styles.card}
    >
      <Text style={styles.label}>
        TOTAL ASSETS
      </Text>

      {Object.entries(totalAssets).map(([currency, amount]) => (
        <Text key={currency} style={styles.subtitle}>
          {formatCurrency(amount, currency)}
        </Text>
      ))}

      <Text style={styles.subtitle}>
        {accountCount} Active Accounts
      </Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 24,
    borderRadius: 20,
    marginBottom: 24,
    ...SHADOWS.large,
  },

  label: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: 1,
  },

  balance: {
    marginTop: 10,
    color: '#fff',
    fontSize: 34,
    fontWeight: '800',
  },

  subtitle: {
    marginTop: 10,
    color: 'rgba(255,255,255,0.85)',
    fontSize: 16,
  },
});