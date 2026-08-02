import React from 'react';
import {
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';

import { COLORS } from '@/src/theme';

const ACCOUNT_COLORS = [
  '#2563EB', // Blue
  '#059669', // Green
  '#9333EA', // Purple
  '#EA580C', // Orange
  '#DB2777', // Pink
  '#0891B2', // Cyan
  '#DC2626', // Red
  '#64748B', // Slate
];

interface Props {
  value?: string;
  onChange(color: string): void;
}

export default function ColorPicker({
  value,
  onChange,
}: Props) {
  return (
    <View style={styles.container}>
      {ACCOUNT_COLORS.map(color => {
        const selected = value === color;

        return (
          <TouchableOpacity
            key={color}
            style={[
              styles.swatch,
              {
                backgroundColor: color,
              },
              selected && styles.selected,
            ]}
            onPress={() => onChange(color)}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
  },

  swatch: {
    width: 42,
    height: 42,
    borderRadius: 21,

    borderWidth: 3,
    borderColor: 'transparent',
  },

  selected: {
    borderColor: COLORS.text,
  },
});