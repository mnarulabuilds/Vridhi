import React, { createContext, useContext, useState, useEffect } from 'react';
import * as LocalAuthentication from 'expo-local-authentication';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert, AppState, InteractionManager, Platform } from 'react-native';

const BIOMETRIC_CONFIG_KEY = '@vridhi_biometric__config';

interface BiometricContextType {
  biometrics: boolean;
  isUnlocked: boolean;
  loading: boolean;
  authenticateBiometrics: () => Promise<{ success: boolean; error: string | null }>;
  toggleBiometrics: (value: boolean) => Promise<boolean>;
  setUnlocked: (value: boolean) => void;
}

const BiometricContext = createContext<BiometricContextType | undefined>(undefined);

function waitForActiveApp() {
  return new Promise<void>((resolve) => {
    let settled = false;
    const finish = () => {
      if (settled) {
        return;
      }
      settled = true;
      InteractionManager.runAfterInteractions(() => {
        setTimeout(resolve, Platform.OS === 'android' ? 450 : 50);
      });
    };

    if (AppState.currentState === 'active') {
      finish();
      return;
    }

    const sub = AppState.addEventListener('change', (next) => {
      if (next === 'active') {
        sub.remove();
        finish();
      }
    });

    setTimeout(() => {
      sub.remove();
      finish();
    }, 2000);
  });
}

export function BiometricProvider({ children }: { children: React.ReactNode }) {
  const [biometrics, setBiometrics] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void loadConfig();
  }, []);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (next) => {
      if (next === 'background' && biometrics) {
        setIsUnlocked(false);
      }
    });
    return () => sub.remove();
  }, [biometrics]);

  const loadConfig = async () => {
    try {
      const stored = await AsyncStorage.getItem(BIOMETRIC_CONFIG_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setBiometrics(Boolean(parsed.useBiometrics));
        setIsUnlocked(!parsed.useBiometrics);
      } else {
        setIsUnlocked(true);
      }
    } catch (e) {
      console.error('Failed to load auth config', e);
      setIsUnlocked(true);
    } finally {
      setLoading(false);
    }
  };

  const saveConfig = async (biometricsValue: boolean) => {
    try {
      setBiometrics(biometricsValue);
      await AsyncStorage.setItem(
        BIOMETRIC_CONFIG_KEY,
        JSON.stringify({ useBiometrics: biometricsValue }),
      );
    } catch (e) {
      console.error('Failed to save auth config', e);
    }
  };

  const authenticateBiometrics = async () => {
    try {
      await waitForActiveApp();

      const enrolledLevel = await LocalAuthentication.getEnrolledLevelAsync();
      if (enrolledLevel === LocalAuthentication.SecurityLevel.NONE) {
        Alert.alert(
          'Screen lock required',
          'Add a PIN, pattern, password, or biometrics in your device settings, then try again.',
        );
        return { success: false, error: 'not_enrolled' };
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Unlock Vridhi',
        fallbackLabel: 'Use passcode',
        cancelLabel: 'Cancel',
        disableDeviceFallback: false,
        requireConfirmation: false,
      });

      if (result.success) {
        setIsUnlocked(true);
        return { success: true, error: null };
      }

      const cancelled =
        result.error === 'user_cancel' ||
        result.error === 'app_cancel' ||
        result.error === 'system_cancel' ||
        result.error === 'user_fallback';
      if (!cancelled && result.error) {
        Alert.alert(
          'Authentication failed',
          'Use your fingerprint, face unlock, or device PIN. If this keeps failing, check that a screen lock is enabled in system settings.',
        );
      }

      return {
        success: false,
        error: result.error || 'Authentication failed',
      };
    } catch (e) {
      console.error('Biometric error:', e);
      Alert.alert('Error', 'Could not start biometric unlock. Try again, or use your device PIN.');
      return { success: false, error: 'An error occurred' };
    }
  };

  const toggleBiometrics = async (value: boolean) => {
    if (value) {
      const result = await authenticateBiometrics();
      if (result.success) {
        await saveConfig(true);
        return true;
      }
      return false;
    }
    await saveConfig(false);
    setIsUnlocked(true);
    return true;
  };

  return (
    <BiometricContext.Provider
      value={{
        biometrics,
        isUnlocked,
        loading,
        authenticateBiometrics,
        toggleBiometrics,
        setUnlocked: setIsUnlocked,
      }}
    >
      {children}
    </BiometricContext.Provider>
  );
}

export function useBiometrics() {
  const context = useContext(BiometricContext);
  if (context === undefined) {
    throw new Error('useBiometrics must be used within an BiometricProvider');
  }
  return context;
}
