import React from 'react';
import { StyleSheet, Switch, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SIZES } from '@/src/theme';
import { useAuth } from '@/src/providers/auth-provider';
import { useBiometrics } from '@/src/providers/biometric-provider';
import PrimaryButton from '@/src/components/form/PrimaryButton';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { biometrics, toggleBiometrics } = useBiometrics();

  return (
    <SafeAreaView style={styles.safe}>
      <Text style={styles.title}>Profile</Text>
      <Text style={styles.name}>{user?.name}</Text>
      <Text style={styles.email}>{user?.email}</Text>
      <View style={styles.row}>
        <Text style={styles.label}>Unlock with biometrics</Text>
        <Switch value={biometrics} onValueChange={(value) => { void toggleBiometrics(value); }} />
      </View>
      <PrimaryButton title="Back" onPress={() => router.back()} />
      <View style={{ height: 12 }} />
      <PrimaryButton title="Log out" onPress={logout} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg, padding: SIZES.padding },
  title: { fontSize: 28, fontWeight: '800', color: COLORS.text, marginBottom: 12 },
  name: { fontSize: 20, fontWeight: '700', color: COLORS.text },
  email: { color: COLORS.textLight, marginBottom: 24 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 },
  label: { color: COLORS.text, fontWeight: '600' },
});
