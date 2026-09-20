import React from 'react';

import {
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { router } from 'expo-router';

import { LinearGradient } from 'expo-linear-gradient';

import { useForm } from 'react-hook-form';

import { zodResolver } from '@hookform/resolvers/zod';

import ScreenContainer from '@/src/components/ScreenContainer';

import AppInput from '@/src/components/form/AppInput';
import PasswordInput from '@/src/components/form/PasswordInput';
import PrimaryButton from '@/src/components/form/PrimaryButton';

import { useAuth } from '@/src/providers/auth-provider';
import BrandLogo from '@/src/components/brand/BrandLogo';
import { appEntryHref } from '@/src/navigation/app-entry';

import {
  loginSchema,
  LoginForm,
} from '@/src/validation/auth.schema';

import {
  COLORS,
} from '@/src/theme';
import { confirmAlert } from '@/src/utils/confirmAlert';

export default function LoginScreen() {
  const {
    login,
    loading,
  } = useAuth();

  const {
    control,
    handleSubmit,
    formState: {
      isSubmitting,
    },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),

    defaultValues: {
      email: '',
      password: '',
    },
  });

  async function onSubmit(
    values: LoginForm,
  ) {
    try {
      const signedInUser = await login(values);

      router.replace(appEntryHref(signedInUser));
    } catch (error: any) {
      const apiUrl =
        process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3001';
      const unreachable =
        !error?.response &&
        (error?.message === 'Network Error' ||
          error?.code === 'ERR_NETWORK');
      confirmAlert(
        'Login Failed',
        unreachable
          ? `Cannot reach the API at ${apiUrl}. Join the same Wi-Fi as the computer running Vridhi, and keep that machine awake.`
          : (error?.response?.data?.message ??
            error?.message ??
            'Unable to login.'),
      );
    }
  }

  return (
    <LinearGradient
      colors={[
        COLORS.primary,
        COLORS.primaryDark,
      ]}
      style={styles.background}
    >
      <ScreenContainer scrollable>
        <View style={styles.container}>
          <View style={styles.header}>
            <BrandLogo size={96} style={styles.logo} />

            <Text style={styles.title}>
              Welcome Back
            </Text>

            <Text style={styles.subtitle}>
              Sign in to continue using
              Vridhi
            </Text>
          </View>

          <View>
            <AppInput
              control={control}
              name="email"
              label="Email"
              placeholder="Enter email"

              autoCapitalize="none"

              keyboardType="email-address"
            />

            <PasswordInput
              control={control}
              name="password"
              label="Password"
              placeholder="Enter password"
            />

            <PrimaryButton
              title="Sign In"
              loading={
                loading || isSubmitting
              }
              onPress={handleSubmit(
                onSubmit,
              )}
            />

            <TouchableOpacity
              style={styles.register}
              onPress={() =>
                router.push(
                  '/(auth)/forgot-password',
                )
              }
            >
              <Text style={styles.registerText}>Forgot password?</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.register}
              onPress={() =>
                router.push(
                  '/(auth)/register',
                )
              }
            >
              <Text
                style={
                  styles.registerText
                }
              >
                Don’t have an account?
                Create one
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.footer}>
            API {process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3001'}
          </Text>
        </View>
      </ScreenContainer>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },

  container: {
    flex: 1,

    justifyContent:
      'space-between',
  },

  header: {
    alignItems: 'center',

    marginTop: 40,
  },

  logo: {
    marginBottom: 24,
  },

  title: {
    fontSize: 32,

    fontWeight: '700',

    color: COLORS.primary,
  },

  subtitle: {
    color:
      COLORS.primary,

    marginTop: 10,

    fontSize: 15,
  },

  register: {
    marginTop: 20,

    alignItems: 'center',
  },

  registerText: {
    color: COLORS.primaryDark,

    fontWeight: '600',
  },

  footer: {
    marginBottom: 20,

    color:
      COLORS.primaryDark,

    textAlign: 'center',
  },
});
