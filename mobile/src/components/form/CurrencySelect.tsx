import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Dropdown } from 'react-native-element-dropdown';
import { COLORS } from '@/src/theme';
import {
  CURRENCY_OPTIONS,
  normalizeCurrencyCode,
  type CurrencyCode,
} from '@/src/constants/currencies';

type Props = {
  label?: string;
  value: string;
  onChange: (value: CurrencyCode) => void;
  placeholder?: string;
  accessibilityLabel?: string;
};

export default function CurrencySelect({
  label,
  value,
  onChange,
  placeholder = 'Select currency',
  accessibilityLabel,
}: Props) {
  const selected = normalizeCurrencyCode(value);

  return (
    <View style={styles.container}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <Dropdown
        style={styles.dropdown}
        data={[...CURRENCY_OPTIONS]}
        labelField="label"
        valueField="value"
        value={selected}
        placeholder={placeholder}
        onChange={(item) => onChange(item.value as CurrencyCode)}
        accessibilityLabel={accessibilityLabel ?? label ?? 'Currency'}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 18,
  },
  label: {
    marginBottom: 8,
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  dropdown: {
    height: 56,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    paddingHorizontal: 16,
  },
});
