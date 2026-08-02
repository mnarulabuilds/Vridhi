import React, { useEffect } from 'react';
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

import { COLORS, SHADOWS } from '@/src/theme';
import { useBiometrics } from '@/src/providers/biometric-provider';
import { confirmAlert } from '@/src/utils/confirmAlert';

export default function UnlockScreen() {
  const {
    authenticateBiometrics,
    biometrics,
    loading,
    isUnlocked,
    setUnlocked,
  } = useBiometrics();

  useEffect(() => {
    if (loading) {
      return;
    }

    if (!biometrics) {
      setUnlocked(true);
      // router.replace('/(tabs)');
      return;
    }

    if (isUnlocked) {
      // router.replace('/(tabs)');
      return;
    }

    void unlock();
  }, [
    loading,
    biometrics,
    isUnlocked,
  ]);

  async function unlock() {
    try {
      const result =
        await authenticateBiometrics();

      if (result.success) {
        setUnlocked(true);
        // router.replace('/(tabs)');
      }
    } catch {
      confirmAlert(
        'Authentication Failed',
        'Unable to authenticate.'
      );
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator
          size="large"
          color={COLORS.primary}
        />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={[
          COLORS.primary,
          COLORS.primaryDark,
        ]}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.content}>
        <Text style={styles.title}>
          Unlock Vridhi
        </Text>

        <Text style={styles.subtitle}>
          Authenticate to continue
        </Text>

        <TouchableOpacity
          style={styles.button}
          onPress={unlock}
        >
          <Text style={styles.buttonText}>
            Unlock
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },

  title: {
    color: '#fff',
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 12,
  },

  subtitle: {
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 40,
    fontSize: 16,
  },

  button: {
    width: '100%',
    paddingVertical: 18,
    borderRadius: 14,
    backgroundColor: '#fff',
    alignItems: 'center',
    ...SHADOWS.medium,
  },

  buttonText: {
    color: COLORS.primary,
    fontSize: 18,
    fontWeight: '700',
  },
});