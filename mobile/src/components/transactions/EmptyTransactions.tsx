import React from 'react';
import {
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';

import { COLORS } from '@/src/theme';

interface Props {
}

export default function EmptyTransactions({
}: Props) {
  return (
    <View style={styles.container}>
      <Ionicons
        name="wallet-outline"
        size={72}
        color={COLORS.primary}
      />

      <Text style={styles.title}>
        No Transactions Yet
      </Text>

      <Text style={styles.subtitle}>
        Start tracking your income and
        expenses by creating your first
        transaction.
      </Text>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingTop: 80,
  },

  title: {
    marginTop: 20,
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.text,
  },

  subtitle: {
    marginTop: 12,
    textAlign: 'center',
    color: COLORS.textLight,
    lineHeight: 22,
    marginBottom: 32,
  },
});