import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { COLORS } from '@/src/theme';

interface Props {
  history: Array<{ month: string; netWorth: number }>;
}

export default function NetWorthSpark({ history }: Props) {
  if (history.length < 2) return null;
  const values = history.map((row) => row.netWorth);
  const min = Math.min(0, ...values);
  const max = Math.max(...values, 1);
  const span = max - min || 1;

  return (
    <View style={styles.wrap}>
      {history.map((row) => {
        const height = Math.max(4, ((row.netWorth - min) / span) * 36);
        return (
          <View key={row.month} style={styles.col}>
            <View
              style={[
                styles.bar,
                {
                  height,
                  backgroundColor: row.netWorth >= 0 ? 'rgba(255,255,255,0.95)' : COLORS.warning,
                },
              ]}
            />
            <Text style={styles.label}>{row.month.slice(5)}</Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginTop: 16,
    height: 56,
  },
  col: { flex: 1, alignItems: 'center', justifyContent: 'flex-end' },
  bar: { width: 8, borderRadius: 4 },
  label: { color: 'rgba(255,255,255,0.75)', fontSize: 9, marginTop: 4 },
});
