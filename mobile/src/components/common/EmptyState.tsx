import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { COLORS } from '@/src/theme';
import PrimaryButton from '@/src/components/form/PrimaryButton';

type Props = {
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
};

export default function EmptyState({ title, message, actionLabel, onAction }: Props) {
  return (
    <View style={styles.wrap} accessibilityRole="summary" accessibilityLabel={`${title}. ${message}`}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
      {actionLabel && onAction ? <PrimaryButton title={actionLabel} onPress={onAction} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', paddingVertical: 32, gap: 12 },
  title: { fontSize: 18, fontWeight: '700', color: COLORS.text },
  message: { color: COLORS.textLight, textAlign: 'center', marginBottom: 8 },
});
