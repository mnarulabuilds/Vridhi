import React from 'react';

import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableOpacityProps,
} from 'react-native';

import { COLORS, SHADOWS } from '@/src/theme';

interface PrimaryButtonProps
  extends TouchableOpacityProps {
  title: string;
  loading?: boolean;
}

export default function PrimaryButton({
  title,
  loading = false,
  disabled,
  style,
  ...props
}: PrimaryButtonProps) {
  const isDisabled =
    disabled || loading;

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      disabled={isDisabled}
      style={[
        styles.button,
        isDisabled &&
          styles.buttonDisabled,
        style,
      ]}
      {...props}
    >
      {loading ? (
        <ActivityIndicator
          color="#FFF"
        />
      ) : (
        <Text style={styles.title}>
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 56,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.medium,
  },

  buttonDisabled: {
    opacity: 0.6,
  },

  title: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 16,
  },
});