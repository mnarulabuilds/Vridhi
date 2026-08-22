import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import ScreenContainer from '@/src/components/ScreenContainer';
import AppInput from '@/src/components/form/AppInput';
import PasswordInput from '@/src/components/form/PasswordInput';
import PrimaryButton from '@/src/components/form/PrimaryButton';
import { useForm } from 'react-hook-form';
import { COLORS } from '@/src/theme';
import AuthApi from '@/src/api/auth.api';
import { confirmAlert } from '@/src/utils/confirmAlert';

export default function ForgotPasswordScreen() {
  const { control, handleSubmit, getValues, setValue } = useForm({
    defaultValues: { email: '', token: '', newPassword: '' },
  });
  const [token, setToken] = useState('');
  const [busy, setBusy] = useState(false);

  async function requestReset() {
    setBusy(true);
    try {
      const result = await AuthApi.forgotPassword(getValues('email'));
      if (result.debugResetToken) {
        setToken(result.debugResetToken);
        setValue('token', result.debugResetToken);
        confirmAlert(
          'Reset token (dev only)',
          'Paste the token below. Production will email this instead of showing it.',
        );
      } else {
        confirmAlert('Check your inbox', 'If that email is registered, a reset was issued.');
      }
    } catch (error: any) {
      confirmAlert('Error', error?.response?.data?.message ?? 'Could not start reset');
    } finally {
      setBusy(false);
    }
  }

  async function submitReset(values: { token: string; newPassword: string }) {
    setBusy(true);
    try {
      await AuthApi.resetPassword({
        token: token || values.token,
        newPassword: values.newPassword,
      });
      confirmAlert('Password updated', 'You can sign in with the new password.');
      router.replace('/(auth)/login');
    } catch (error: any) {
      confirmAlert('Error', error?.response?.data?.message ?? 'Reset failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <LinearGradient colors={[COLORS.primary, COLORS.primaryDark]} style={styles.background}>
      <ScreenContainer scrollable title="Reset password">
        <View style={styles.gap}>
          <AppInput control={control} name="email" label="Email" autoCapitalize="none" keyboardType="email-address" />
          <PrimaryButton title="Send reset" loading={busy} onPress={() => void requestReset()} />
          <Text style={styles.hint}>Then enter the token and a new password.</Text>
          <AppInput control={control} name="token" label="Reset token" />
          <PasswordInput control={control} name="newPassword" label="New password" />
          <PrimaryButton title="Set new password" loading={busy} onPress={handleSubmit(submitReset)} />
          <PrimaryButton title="Back to login" onPress={() => router.back()} />
        </View>
      </ScreenContainer>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1 },
  gap: { gap: 12 },
  hint: { color: COLORS.primaryDark, marginVertical: 8 },
});
