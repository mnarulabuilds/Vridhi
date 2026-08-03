import React from 'react';

import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
} from 'react-native';

import { COLORS } from '@/src/theme';

export interface FilterOption {
  label: string;
  value: string;
}

interface Props {
  value: string;

  options: FilterOption[];

  onChange(value: string): void;
}

export default function FilterChips({
  value,
  options,
  onChange,
}: Props) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {options.map(option => {
        const selected =
          option.value === value;

        return (
          <Pressable
            key={option.value}
            onPress={() =>
              onChange(option.value)
            }
            style={[
              styles.chip,
              selected &&
                styles.selectedChip,
            ]}
          >
            <Text
              style={[
                styles.label,
                selected &&
                  styles.selectedLabel,
              ]}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 10,
    paddingVertical: 12,
  },

  chip: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 24,
    backgroundColor: COLORS.surface,
  },

  selectedChip: {
    backgroundColor: COLORS.primary,
  },

  label: {
    color: COLORS.text,
    fontWeight: '600',
  },

  selectedLabel: {
    color: '#fff',
  },
});