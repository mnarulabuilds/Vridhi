import React from 'react';
import { ScrollView, StyleSheet, View, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SIZES } from '@/src/theme';

type Props = React.PropsWithChildren<{
  scroll?: boolean;
  style?: ViewStyle;
  accessibilityLabel?: string;
}>;

export default function Screen({ children, scroll, style, accessibilityLabel }: Props) {
  const content = scroll ? (
    <ScrollView
      contentContainerStyle={[styles.scroll, style]}
      showsVerticalScrollIndicator={false}
      accessibilityLabel={accessibilityLabel}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.body, style]} accessibilityLabel={accessibilityLabel}>
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
