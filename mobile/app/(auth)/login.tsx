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
      await login(values);

      router.replace('/(app)/(tabs)');
    } catch (error: any) {
      confirmAlert(
        'Login Failed',
        error?.response?.data?.message ??
        error?.message ??
        'Unable to login.',
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
            <View style={styles.logo}>
              <Text style={styles.logoText}>
                V
              </Text>
            </View>

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
                  '/(auth)/register',
                )
              }
            >
              <Text
                style={
                  styles.registerText
                }
              >
                Don't have an account?
                Create one
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.footer}>
            Secure authentication
            powered by Vridhi
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
    width: 90,

    height: 90,

    borderRadius: 24,

    justifyContent: 'center',

    alignItems: 'center',

    backgroundColor:
      COLORS.primaryDark,

    marginBottom: 24,
  },

  logoText: {
    color: COLORS.textDark,

    fontWeight: '700',

    fontSize: 42,
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