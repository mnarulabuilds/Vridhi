import React, { useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import Screen from '@/src/components/common/Screen';
import PrimaryButton from '@/src/components/form/PrimaryButton';
import { COLORS, SIZES } from '@/src/theme';
import { useAuth } from '@/src/providers/auth-provider';
import { UsersApi } from '@/src/api/users.api';
import { useAccounts } from '@/src/hooks/useAccounts';

export default function OnboardingScreen() {
  const { user, setUser } = useAuth();
  const { createAccount } = useAccounts();
  const [accountName, setAccountName] = useState('Primary account');
  const [openingBalance, setOpeningBalance] = useState('0');
  const [busy, setBusy] = useState(false);

  async function finish() {
    setBusy(true);
    try {
      await createAccount({
        name: accountName.trim() || 'Primary account',
        type: 'SAVINGS',
        openingBalance: Number(openingBalance) || 0,
      });
      const profile = await UsersApi.completeOnboarding();
      setUser(profile);
      router.replace('/(app)/(tabs)');
    } catch (error: unknown) {
      Alert.alert('Setup incomplete', 'Could not finish onboarding. Try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen scroll showBack={false} accessibilityLabel="Onboarding">
      <Text style={styles.title}>Welcome{user?.name ? `, ${user.name.split(' ')[0]}` : ''}</Text>
      <Text style={styles.subtitle}>Set up your first account to track balances and net worth.</Text>

      <Text style={styles.label}>Account name</Text>
      <TextInput
        style={styles.input}
        value={accountName}
        onChangeText={setAccountName}
        accessibilityLabel="Account name"
      />
      <Text style={styles.label}>Opening balance</Text>
      <TextInput
        style={styles.input}
        keyboardType="decimal-pad"
        value={openingBalance}
        onChangeText={setOpeningBalance}
        accessibilityLabel="Opening balance"
      />

      <View style={{ height: 16 }} />
      <PrimaryButton title="Continue to dashboard" loading={busy} onPress={finish} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 28, fontWeight: '800', color: COLORS.text, marginBottom: 8 },
  subtitle: { color: COLORS.textLight, marginBottom: 24, lineHeight: 22 },
  label: { fontWeight: '600', color: COLORS.text, marginBottom: 6 },
  input: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  skip: { marginTop: SIZES.padding, textAlign: 'center', color: COLORS.primary, fontWeight: '700' },
});
