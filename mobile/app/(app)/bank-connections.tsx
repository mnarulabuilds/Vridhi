import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import ScreenHeader from '@/src/components/navigation/ScreenHeader';
import PrimaryButton from '@/src/components/form/PrimaryButton';
import { COLORS, SIZES } from '@/src/theme';
import { ConnectionsApi, type FinancialConnection } from '@/src/api/connections.api';

export default function BankConnectionsScreen() {
  const [connections, setConnections] = useState<FinancialConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [linking, setLinking] = useState(false);
  const [syncingId, setSyncingId] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setConnections(await ConnectionsApi.list());
    } catch (error: unknown) {
      const message =
        error && typeof error === 'object' && 'response' in error
          ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      if (message?.toLowerCase().includes('entitlement')) {
        Alert.alert('Pro feature', 'Upgrade to Pro or complete KYC to link banks.', [
          { text: 'Verify identity', onPress: () => router.push('/kyc') },
          { text: 'Plans', onPress: () => router.push('/subscription') },
        ]);
      }
      setConnections([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function linkBank() {
    setLinking(true);
    try {
      const session = await ConnectionsApi.createLinkSession();
      const connection = await ConnectionsApi.complete(session.linkToken);
      Alert.alert('Linked', `${connection.institutionName ?? 'Bank'} is connected.`);
      await refresh();
    } catch (error: unknown) {
      const message =
        error && typeof error === 'object' && 'response' in error
          ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      Alert.alert('Could not link', message ?? 'Try again after KYC or Pro upgrade.');
    } finally {
      setLinking(false);
    }
  }

  async function syncConnection(id: string) {
    setSyncingId(id);
    try {
      await ConnectionsApi.sync(id);
      Alert.alert('Synced', 'Latest transactions were imported.');
      await refresh();
    } catch {
      Alert.alert('Sync failed', 'Check connection status and try again.');
      await refresh();
    } finally {
      setSyncingId(null);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <ScreenHeader
          title="Linked banks"
          breadcrumbs={[
            { label: 'Settings', href: '/settings' },
            { label: 'Banks' },
          ]}
        />
        <Text style={styles.lead}>
          Connect real accounts to sync balances and transactions into Vridhi. Demo mode uses a sandbox provider.
        </Text>
        <PrimaryButton title="Link a bank account" loading={linking} onPress={linkBank} />
        <Text style={styles.hint} onPress={() => router.push('/kyc')}>
          Complete KYC first for regulated features →
        </Text>

        {loading ? (
          <ActivityIndicator color={COLORS.primary} style={{ marginTop: 24 }} />
        ) : connections.length === 0 ? (
          <Text style={styles.empty}>No linked accounts yet.</Text>
        ) : (
          connections.map((connection) => (
            <View key={connection.id} style={styles.card}>
              <Text style={styles.bank}>{connection.institutionName ?? 'Financial institution'}</Text>
              <Text style={styles.meta}>Status: {connection.status}</Text>
              {connection.lastError ? (
                <Text style={styles.error}>{connection.lastError}</Text>
              ) : null}
              {connection.lastSyncedAt ? (
                <Text style={styles.meta}>
                  Last synced {new Date(connection.lastSyncedAt).toLocaleString()}
                </Text>
              ) : null}
              <PrimaryButton
                title="Sync now"
                loading={syncingId === connection.id}
                onPress={() => syncConnection(connection.id)}
              />
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  scroll: { padding: SIZES.padding, paddingBottom: 40 },
  lead: { color: COLORS.textLight, marginVertical: 12, lineHeight: 20 },
  hint: { color: COLORS.primary, fontWeight: '600', marginBottom: 16 },
  empty: { color: COLORS.textLight, marginTop: 24 },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 14,
    marginTop: 12,
    gap: 8,
  },
  bank: { fontWeight: '800', fontSize: 16, color: COLORS.text },
  meta: { color: COLORS.textLight, fontSize: 13 },
  error: { color: COLORS.danger, fontSize: 13 },
});
