import React from 'react';

import {
  Pressable,
  StyleSheet,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';

import { COLORS, SHADOWS } from '@/src/theme';

interface Props {
  onPress(): void;
}

export default function FloatingActionButton({
  onPress,
}: Props) {
  return (
    <Pressable
      style={styles.fab}
      onPress={onPress}
    >
      <Ionicons
        name="add"
        size={28}
        color="#fff"
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',

    right: 24,

    bottom: 32,

    width: 60,

    height: 60,

    borderRadius: 30,

    justifyContent: 'center',

    alignItems: 'center',

    backgroundColor: COLORS.primary,

    ...SHADOWS.large,
  },
});