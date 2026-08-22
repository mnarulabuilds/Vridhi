import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { COLORS, SHADOWS } from '@/src/theme';
import type { InsightNotice } from '@/src/api/reports.api';

const TONE = {
  warning: { border: COLORS.warning, bg: COLORS.warningLight },
  good: { border: COLORS.success, bg: COLORS.successLight },
  info: { border: COLORS.primary, bg: COLORS.primaryLight },
};

export default function InsightNoticeCard({ notice }: { notice: InsightNotice }) {
  const tone = TONE[notice.severity];
  return (
    <View style={[styles.card, { borderLeftColor: tone.border, backgroundColor: tone.bg }]}>
      <Text style={styles.title}>{notice.title}</Text>
      <Text style={styles.detail}>{notice.detail}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderLeftWidth: 4,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    ...SHADOWS.small,
  },
  title: { fontWeight: '700', color: COLORS.text, marginBottom: 4 },
  detail: { color: COLORS.textLight, fontSize: 13, lineHeight: 18 },
});
