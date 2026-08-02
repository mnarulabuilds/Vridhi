import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

import { COLORS, SHADOWS } from '@/src/theme';
import { useAuth } from '@/src/providers/auth-provider';

export default function LoginScreen() {
  const { login, loading } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [submitting, setSubmitting] = useState(false);

  async function handleLogin() {
    if (!email.trim()) {
      Alert.alert('Validation', 'Please enter your email.');
      return;
    }

    if (!password.trim()) {
      Alert.alert('Validation', 'Please enter your password.');
      return;
    }

    try {
      setSubmitting(true);

      await login({
        email: email.trim(),
        password,
      });

    } catch (error: any) {
      Alert.alert(
        'Login Failed',
        error?.response?.data?.message ??
          error?.message ??
          'Unable to login.',
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={[COLORS.primary, COLORS.primaryDark]}
        style={StyleSheet.absoluteFill}
      />

      <KeyboardAvoidingView
        style={styles.content}
        behavior={
          Platform.OS === 'ios'
            ? 'padding'
            : undefined
        }
      >
        <View style={styles.header}>
          <View style={styles.logo}>
            <Text style={styles.logoText}>V</Text>
          </View>

          <Text style={styles.title}>
            Welcome Back
          </Text>

          <Text style={styles.subtitle}>
            Sign in to continue using Vridhi
          </Text>
        </View>

        <View style={styles.form}>
          <TextInput
            placeholder="Email"
            placeholderTextColor="#999"
            autoCapitalize="none"
            keyboardType="email-address"
            style={styles.input}
            value={email}
            onChangeText={setEmail}
          />

          <TextInput
            placeholder="Password"
            placeholderTextColor="#999"
            secureTextEntry
            style={styles.input}
            value={password}
            onChangeText={setPassword}
          />

          <TouchableOpacity
            style={styles.button}
            disabled={loading || submitting}
            onPress={handleLogin}
          >
            {loading || submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>
                Sign In
              </Text>
            )}
          </TouchableOpacity>
        </View>

        <Text style={styles.footer}>
          Secure authentication powered by
          Vridhi
        </Text>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  content: {
    flex: 1,
    justifyContent: 'space-between',
    padding: 32,
  },

  header: {
    alignItems: 'center',
    marginTop: 60,
  },

  logo: {
    width: 88,
    height: 88,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor:
      'rgba(255,255,255,0.18)',
    marginBottom: 24,
  },

  logoText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 40,
  },

  title: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 30,
  },

  subtitle: {
    marginTop: 10,
    color: 'rgba(255,255,255,0.8)',
    fontSize: 15,
  },

  form: {
    gap: 16,
  },

  input: {
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 16,
    fontSize: 16,
  },

  button: {
    marginTop: 10,
    backgroundColor: COLORS.primaryDark,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    ...SHADOWS.medium,
  },

  buttonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 17,
  },

  footer: {
    color: 'rgba(255,255,255,0.75)',
    textAlign: 'center',
    marginBottom: 20,
  },
});