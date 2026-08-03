import React from 'react';

import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from 'react-native-paper';

import { COLORS } from '@/src/theme';

interface Props {
  title?: string;
  children: React.ReactNode;
  scrollable?: boolean;
}

export default function ScreenContainer({
  title,
  children,
  scrollable = false,
}: Props) {
  const content = (
    <>
      {title && (
        <Text style={styles.title}>
          {title}
        </Text>
      )}

      {children}
    </>
  );

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
        {scrollable ? (
          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.scrollContent}
          >
            {content}
          </ScrollView>
        ) : (
          content
        )}
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

  scrollContent: {
    paddingBottom: 40,
    flexGrow: 1,
  },

  title: {
    color: COLORS.primaryDark,
    fontSize: 24,
    paddingTop: 16,
    marginBottom: 20,
    fontWeight: 'bold',
  },
});