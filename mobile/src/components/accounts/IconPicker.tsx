import React from 'react';

import {
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';

import { COLORS } from '@/src/theme';

const ICONS = [
  'cash-outline',
  'wallet-outline',
  'business-outline',
  'card-outline',
  'trending-up-outline',
  'diamond-outline',
  'logo-bitcoin',
  'home-outline',
] as const;

interface Props {
  value?: string;

  onChange(icon: string): void;
}

export default function IconPicker({
  value,
  onChange,
}: Props) {
  return (
    <View style={styles.container}>
      {ICONS.map(icon => {
        const selected = value === icon;

        return (
          <TouchableOpacity
            key={icon}
            style={[
              styles.icon,
              selected && styles.selected,
            ]}
            onPress={() => onChange(icon)}
          >
            <Ionicons
              name={icon}
              size={26}
              color={
                selected
                  ? '#fff'
                  : COLORS.primary
              }
            />
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },

  icon: {
    width: 58,
    height: 58,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',

    backgroundColor: COLORS.surface,

    borderWidth: 1,

    borderColor: COLORS.border,
  },

  selected: {
    backgroundColor: COLORS.primary,

    borderColor: COLORS.primary,
  },
});