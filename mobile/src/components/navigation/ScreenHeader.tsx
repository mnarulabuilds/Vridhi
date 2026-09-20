import React from 'react';
import { Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/src/theme';

export type Breadcrumb = {
  label: string;
  href?: string;
  onPress?: () => void;
};

type Props = {
  title?: string;
  breadcrumbs?: Breadcrumb[];
  showBack?: boolean;
  backIcon?: 'back' | 'close';
  onBack?: () => void;
  rightSlot?: React.ReactNode;
};

export function navigateBack(fallbackHref = '/(app)/(tabs)' as const) {
  if (router.canGoBack()) {
    router.back();
    return;
  }
  router.replace(fallbackHref);
}

export default function ScreenHeader({
  title,
  breadcrumbs,
  showBack = true,
  backIcon = 'back',
  onBack,
  rightSlot,
}: Props) {
  const handleBack = () => {
    if (onBack) {
      onBack();
      return;
    }
    navigateBack();
  };

  const iconName = backIcon === 'close' ? 'close' : 'chevron-back';

  return (
    <View style={styles.wrap}>
      {breadcrumbs && breadcrumbs.length > 0 ? (
        <View style={styles.breadcrumbs} accessibilityRole="text">
          {breadcrumbs.map((crumb, index) => {
            const isLast = index === breadcrumbs.length - 1;
            const canPress = Boolean(crumb.onPress || crumb.href);
            const content = (
              <Text
                style={[
                  styles.crumb,
                  isLast && styles.crumbActive,
                  canPress && !isLast && styles.crumbLink,
                ]}
                numberOfLines={1}
              >
                {crumb.label}
              </Text>
            );
            return (
              <React.Fragment key={`${crumb.label}-${index}`}>
                {index > 0 ? <Text style={styles.separator}>›</Text> : null}
                {canPress && !isLast ? (
                  <Pressable
                    onPress={() => {
                      if (crumb.onPress) {
                        crumb.onPress();
                        return;
                      }
                      if (crumb.href) {
                        router.push(crumb.href as never);
                      }
                    }}
                    accessibilityRole="link"
                    accessibilityLabel={crumb.label}
                  >
                    {content}
                  </Pressable>
                ) : (
                  content
                )}
              </React.Fragment>
            );
          })}
        </View>
      ) : null}

      {(showBack || title || rightSlot) && (
        <View style={styles.row}>
          {showBack ? (
            <TouchableOpacity
              onPress={handleBack}
              hitSlop={12}
              style={styles.backBtn}
              accessibilityRole="button"
              accessibilityLabel={backIcon === 'close' ? 'Close' : 'Go back'}
            >
              <Ionicons name={iconName} size={24} color={COLORS.text} />
            </TouchableOpacity>
          ) : (
            <View style={styles.backPlaceholder} />
          )}
          {title ? (
            <Text style={styles.title} numberOfLines={1}>
              {title}
            </Text>
          ) : (
            <View style={styles.titleSpacer} />
          )}
          {rightSlot ?? <View style={styles.backPlaceholder} />}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: 12,
  },
  breadcrumbs: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginBottom: 8,
    gap: 2,
  },
  crumb: {
    fontSize: 13,
    color: COLORS.textLight,
    maxWidth: 140,
  },
  crumbLink: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  crumbActive: {
    color: COLORS.text,
    fontWeight: '700',
  },
  separator: {
    color: COLORS.textLight,
    marginHorizontal: 4,
    fontSize: 13,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtn: {
    width: 32,
    alignItems: 'flex-start',
  },
  backPlaceholder: {
    width: 32,
  },
  title: {
    flex: 1,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.text,
  },
  titleSpacer: {
    flex: 1,
  },
});
