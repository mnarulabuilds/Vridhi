import React from 'react';

import {
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {
  Control,
  Controller,
  FieldValues,
  Path,
} from 'react-hook-form';

import {
  Dropdown,
} from 'react-native-element-dropdown';

import {
  COLORS,
} from '@/src/theme';

export interface SelectOption {
  label: string;
  value: string;
}

interface Props<T extends FieldValues> {
  control: Control<T>;

  name: Path<T>;

  label?: string;

  placeholder?: string;

  data: SelectOption[];
}

export default function AppSelect<
  T extends FieldValues,
>({
  control,
  name,
  label,
  placeholder,
  data,
}: Props<T>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({
        field: {
          value,
          onChange,
        },
        fieldState: { error },
      }) => (
        <View style={styles.container}>
          {label && (
            <Text style={styles.label}>
              {label}
            </Text>
          )}

          <Dropdown
            style={[
              styles.dropdown,
              error && styles.errorBorder,
            ]}
            data={data}
            value={value}
            labelField="label"
            valueField="value"
            placeholder={
              placeholder ??
              'Select'
            }
            onChange={(item) =>
              onChange(item.value)
            }
          />

          {error && (
            <Text style={styles.error}>
              {error.message}
            </Text>
          )}
        </View>
      )}
    />
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
    backgroundColor:
      COLORS.surface,
    paddingHorizontal: 16,
  },

  errorBorder: {
    borderColor: COLORS.danger,
  },

  error: {
    marginTop: 6,
    color: COLORS.danger,
    fontSize: 13,
  },
});