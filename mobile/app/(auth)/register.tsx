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
  registerSchema,
  RegisterForm,
} from '@/src/validation/auth.schema';

import { COLORS } from '@/src/theme';

export default function RegisterScreen() {
  const {
    register,
    loading,
  } = useAuth();

  const {
    control,
    handleSubmit,
    formState: {
      isSubmitting,
    },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),

    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  async function onSubmit(
    values: RegisterForm,
  ) {
    try {
      await register({
        name: values.name,
        email: values.email,
        password: values.password,
      });

      router.replace('/(app)/(tabs)');
    } catch (error: any) {
      Alert.alert(
        'Registration Failed',
        error?.response?.data?.message ??
          error?.message ??
          'Unable to create account.',
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
      <ScreenContainer>
        <View style={styles.container}>
          <View style={styles.header}>
            <View style={styles.logo}>
              <Text style={styles.logoText}>
                V
              </Text>
            </View>

            <Text style={styles.title}>
              Create Account
            </Text>

            <Text style={styles.subtitle}>
              Start your financial journey
            </Text>
          </View>

          <View>
            <AppInput
              control={control}
              name="name"
              label="Full Name"
              placeholder="John Doe"
            />

            <AppInput
              control={control}
              name="email"
              label="Email"
              placeholder="john@email.com"
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <PasswordInput
              control={control}
              name="password"
              label="Password"
              placeholder="Password"
            />

            <PasswordInput
              control={control}
              name="confirmPassword"
              label="Confirm Password"
              placeholder="Confirm Password"
            />

            <PrimaryButton
              title="Create Account"
              loading={
                loading || isSubmitting
              }
              onPress={handleSubmit(
                onSubmit,
              )}
            />

            <TouchableOpacity
              style={styles.loginButton}
              onPress={() =>
                router.replace(
                  '/(auth)/login',
                )
              }
            >
              <Text
                style={styles.loginText}
              >
                Already have an account?
                {' '}
                Sign In
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.footer}>
            Secure authentication powered
            by Vridhi
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
    marginTop: 40,
    alignItems: 'center',
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
    color: COLORS.primaryLight,
    fontWeight: '700',
    fontSize: 42,
  },

  title: {
    color: COLORS.primaryDark,
    fontWeight: '700',
    fontSize: 32,
  },

  subtitle: {
    color:
      COLORS.primaryLight,
    marginTop: 10,
    fontSize: 15,
  },

  loginButton: {
    marginTop: 20,
    alignItems: 'center',
  },

  loginText: {
    color: COLORS.primaryLight,
    fontWeight: '600',
  },

  footer: {
    textAlign: 'center',
    color:
      COLORS.primaryLight,
    marginBottom: 20,
  },
});