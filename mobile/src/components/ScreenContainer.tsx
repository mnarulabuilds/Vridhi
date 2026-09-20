import React from 'react';

import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';

import { COLORS } from '@/src/theme';
import ScreenHeader, { type Breadcrumb } from '@/src/components/navigation/ScreenHeader';

interface Props {
  title?: string;
  breadcrumbs?: Breadcrumb[];
  showBack?: boolean;
  backIcon?: 'back' | 'close';
  onBack?: () => void;
  headerRight?: React.ReactNode;
  children: React.ReactNode;
  scrollable?: boolean;
}

export default function ScreenContainer({
  title,
  breadcrumbs,
  showBack = true,
  backIcon = 'back',
  onBack,
  headerRight,
  children,
  scrollable = false,
}: Props) {
  const header = (
    <ScreenHeader
      title={title}
      breadcrumbs={breadcrumbs}
      showBack={showBack}
      backIcon={backIcon}
      onBack={onBack}
      rightSlot={headerRight}
    />
  );

  const content = (
    <>
      {header}
      {children}
    </>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
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
          <View style={styles.body}>{content}</View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },

  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 8,
  },

  body: {
    flex: 1,
  },

  scrollContent: {
    paddingBottom: 40,
    flexGrow: 1,
  },
});
