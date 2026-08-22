import React from 'react';

import {
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { LinearGradient } from 'expo-linear-gradient';

import {
  COLORS,
  SHADOWS,
} from '@/src/theme';

import { formatCurrency } from '@/src/utils/currency';

interface Props {
  netWorth: number;
  assets: number;
  liabilities: number;
  currency?: string;
  accountCount: number;
}

export default function AccountsSummary({
  netWorth,
  assets,
  liabilities,
  currency = 'INR',
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
      <Text style={styles.label}>Net worth</Text>
      <Text style={styles.balance}>{formatCurrency(netWorth, currency)}</Text>
      <View style={styles.row}>
        <Text style={styles.subtitle}>Assets {formatCurrency(assets, currency)}</Text>
        <Text style={styles.subtitle}>Liabilities {formatCurrency(liabilities, currency)}</Text>
      </View>
      <Text style={styles.subtitle}>{accountCount} active accounts</Text>
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
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },

  balance: {
    marginTop: 10,
    color: '#fff',
    fontSize: 34,
    fontWeight: '800',
  },

  row: {
    marginTop: 10,
    gap: 4,
  },

  subtitle: {
    marginTop: 4,
    color: 'rgba(255,255,255,0.85)',
    fontSize: 16,
  },
});
