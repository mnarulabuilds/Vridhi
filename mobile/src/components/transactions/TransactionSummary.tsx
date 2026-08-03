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
  income: number;
  expense: number;
}

export default function TransactionSummary({
  income,
  expense,
}: Props) {
  const balance = income - expense;

  return (
    <LinearGradient
      colors={[
        COLORS.primary,
        COLORS.primaryDark,
      ]}
      style={styles.card}
    >
      <Text style={styles.title}>
        This Month
      </Text>

      <View style={styles.row}>
        <View>
          <Text style={styles.label}>
            Income
          </Text>

          <Text style={styles.income}>
            {formatCurrency(income)}
          </Text>
        </View>

        <View>
          <Text style={styles.label}>
            Expense
          </Text>

          <Text style={styles.expense}>
            {formatCurrency(expense)}
          </Text>
        </View>
      </View>

      <View style={styles.divider} />

      <Text style={styles.label}>
        Net Cash Flow
      </Text>

      <Text style={styles.balance}>
        {formatCurrency(balance)}
      </Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 24,
    borderRadius: 22,
    marginBottom: 24,
    ...SHADOWS.large,
  },

  title: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 20,
  },

  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  label: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 13,
    marginBottom: 6,
  },

  income: {
    color: '#22C55E',
    fontSize: 22,
    fontWeight: '700',
  },

  expense: {
    color: '#EF4444',
    fontSize: 22,
    fontWeight: '700',
  },

  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.15)',
    marginVertical: 20,
  },

  balance: {
    color: '#fff',
    fontSize: 32,
    fontWeight: '800',
  },
});