import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { COLORS, SIZES } from '@/src/theme';
import { useAuth } from '@/src/providers/auth-provider';
import { useBiometrics } from '@/src/providers/biometric-provider';
import PrimaryButton from '@/src/components/form/PrimaryButton';
import { UsersApi } from '@/src/api/users.api';
import AuthApi from '@/src/api/auth.api';
import { Switch } from 'react-native';
import UserStorage from '@/src/storage/user.storage';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout, setUser } = useAuth();
  const { biometrics, toggleBiometrics } = useBiometrics();
  const [name, setName] = useState(user?.name ?? '');
  const [currency, setCurrency] = useState(user?.preferredCurrency ?? 'INR');
  const [saving, setSaving] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmDelete, setConfirmDelete] = useState('');

  async function saveProfile() {
    setSaving(true);
    try {
      const updated = await UsersApi.update({
        name: name.trim(),
        preferredCurrency: currency.trim().toUpperCase() || 'INR',
      });
      setUser(updated);
      await UserStorage.saveCurrentUser(updated);
      Alert.alert('Saved', 'Profile updated');
    } catch (error: any) {
      Alert.alert('Error', error?.response?.data?.message ?? 'Could not update profile');
    } finally {
      setSaving(false);
    }
  }

  async function changePassword() {
    try {
      await AuthApi.changePassword({ currentPassword, newPassword });
      setCurrentPassword('');
      setNewPassword('');
      Alert.alert('Password changed', 'Sign in again on other devices.');
    } catch (error: any) {
      Alert.alert('Error', error?.response?.data?.message ?? 'Could not change password');
    }
  }

  async function exportData() {
    try {
      const payload = await UsersApi.exportData();
      const path = `${FileSystem.cacheDirectory}vridhi-export.json`;
      await FileSystem.writeAsStringAsync(path, JSON.stringify(payload, null, 2));
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(path, { mimeType: 'application/json', UTI: 'public.json' });
      } else {
        Alert.alert('Exported', `Saved to ${path}`);
      }
    } catch (error: any) {
      Alert.alert('Error', error?.response?.data?.message ?? 'Could not export data');
    }
  }

  async function deleteAccount() {
    try {
      await UsersApi.deleteAccount(confirmDelete);
      await logout();
    } catch (error: any) {
      Alert.alert('Error', error?.response?.data?.message ?? 'Could not delete account');
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Profile</Text>
        <Text style={styles.email}>{user?.email}</Text>

        <Text style={styles.label}>Name</Text>
        <TextInput style={styles.input} value={name} onChangeText={setName} />
        <Text style={styles.label}>Preferred currency</Text>
        <TextInput style={styles.input} value={currency} autoCapitalize="characters" onChangeText={setCurrency} />
        <PrimaryButton title="Save profile" loading={saving} onPress={saveProfile} />

        <View style={styles.row}>
          <Text style={styles.label}>Unlock with biometrics</Text>
          <Switch value={biometrics} onValueChange={(value) => { void toggleBiometrics(value); }} />
        </View>

        <Text style={styles.section}>Change password</Text>
        <TextInput
          style={styles.input}
          placeholder="Current password"
          secureTextEntry
          value={currentPassword}
          onChangeText={setCurrentPassword}
        />
        <TextInput
          style={styles.input}
          placeholder="New password (min 8)"
          secureTextEntry
          value={newPassword}
          onChangeText={setNewPassword}
        />
        <PrimaryButton title="Update password" onPress={changePassword} />

        <Text style={styles.section}>Your data</Text>
        <PrimaryButton title="Export JSON" onPress={exportData} />

        <Text style={styles.section}>Delete account</Text>
        <Text style={styles.muted}>This permanently removes accounts, transactions, and chats.</Text>
        <TextInput
          style={styles.input}
          placeholder="Type your password to confirm"
          secureTextEntry
          value={confirmDelete}
          onChangeText={setConfirmDelete}
        />
        <PrimaryButton title="Delete my account" onPress={deleteAccount} />

        <View style={{ height: 16 }} />
        <PrimaryButton title="Back" onPress={() => router.back()} />
        <View style={{ height: 12 }} />
        <PrimaryButton title="Log out" onPress={logout} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  scroll: { padding: SIZES.padding, paddingBottom: 60 },
  title: { fontSize: 28, fontWeight: '800', color: COLORS.text, marginBottom: 8 },
  email: { color: COLORS.textLight, marginBottom: 20 },
  section: { fontSize: 18, fontWeight: '700', marginTop: 24, marginBottom: 12, color: COLORS.text },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 20 },
  label: { color: COLORS.text, fontWeight: '600', marginBottom: 6 },
  muted: { color: COLORS.textLight, marginBottom: 8 },
  input: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
});
