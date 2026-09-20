import React from 'react';
import { ScrollView, StyleSheet, View, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SIZES } from '@/src/theme';
import ScreenHeader, { type Breadcrumb } from '@/src/components/navigation/ScreenHeader';

type Props = React.PropsWithChildren<{
  scroll?: boolean;
  style?: ViewStyle;
  accessibilityLabel?: string;
  title?: string;
  breadcrumbs?: Breadcrumb[];
  showBack?: boolean;
  backIcon?: 'back' | 'close';
  onBack?: () => void;
}>;

export default function Screen({
  children,
  scroll,
  style,
  accessibilityLabel,
  title,
  breadcrumbs,
  showBack = true,
  backIcon = 'back',
  onBack,
}: Props) {
  const header =
    title || breadcrumbs?.length || showBack ? (
      <ScreenHeader
        title={title}
        breadcrumbs={breadcrumbs}
        showBack={showBack}
        backIcon={backIcon}
        onBack={onBack}
      />
    ) : null;

  const content = scroll ? (
    <ScrollView
      contentContainerStyle={[styles.scroll, style]}
      showsVerticalScrollIndicator={false}
      accessibilityLabel={accessibilityLabel}
    >
      {header}
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.body, style]} accessibilityLabel={accessibilityLabel}>
      {header}
      {children}
    </View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {content}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  scroll: { padding: SIZES.padding, paddingBottom: 48 },
  body: { flex: 1, padding: SIZES.padding },
});
