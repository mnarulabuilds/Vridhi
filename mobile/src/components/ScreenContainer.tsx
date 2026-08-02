import React from 'react';

import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';

import { COLORS } from '@/src/theme';

interface Props {
  children: React.ReactNode;
}

export default function ScreenContainer({
  children,
}: Props) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={
          Platform.OS === 'ios'
            ? 'padding'
            : undefined
        }
      >
        {children}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.primaryLight,
  },

  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
});