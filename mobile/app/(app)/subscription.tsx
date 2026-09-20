import React, { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Screen from '@/src/components/common/Screen';
import PrimaryButton from '@/src/components/form/PrimaryButton';
import { SubscriptionsApi } from '@/src/api/subscriptions.api';
import { COLORS } from '@/src/theme';

export default function SubscriptionScreen() {
  const queryClient = useQueryClient();
  const [busy, setBusy] = useState(false);
  const { data } = useQuery({ queryKey: ['subscription'], queryFn: () => SubscriptionsApi.me() });

  async function upgrade() {
    setBusy(true);
    try {
      await SubscriptionsApi.upgrade();
      await queryClient.invalidateQueries({ queryKey: ['subscription'] });
      Alert.alert('Upgraded', 'Vridhi Pro is active on this account (demo billing).');
    } catch {
      Alert.alert('Could not upgrade', 'Try again in a moment.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen
      scroll
      title="Plans"
      breadcrumbs={[
        { label: 'Settings', href: '/settings' },
        { label: 'Subscription' },
      ]}
      accessibilityLabel="Subscription plans"
    >
      <View style={styles.card}>
        <Text style={styles.plan}>Current: {data?.plan ?? 'FREE'}</Text>
        <Text style={styles.muted}>
          Free includes manual tracking. Pro unlocks bank sync, portfolio, advanced reports, and removes ads.
        </Text>
      </View>

      <PrimaryButton title="Upgrade to Pro" loading={busy} onPress={upgrade} />
      {data?.adsEnabled ? (
        <View style={styles.adPlaceholder} accessibilityLabel="Advertisement placeholder">
          <Text style={styles.muted}>Ad placement (free tier)</Text>
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  plan: { fontSize: 18, fontWeight: '700', color: COLORS.text, marginBottom: 8 },
  muted: { color: COLORS.textLight, lineHeight: 20 },
  adPlaceholder: {
    marginTop: 24,
    padding: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
});
