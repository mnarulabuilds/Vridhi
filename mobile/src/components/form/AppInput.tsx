import { COLORS } from '@/src/theme';
import React from 'react';
import {
  Control,
  Controller,
  FieldValues,
  Path,
} from 'react-hook-form';

import {
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
} from 'react-native';

interface Props<T extends FieldValues>
  extends TextInputProps {
  control: Control<T>;
  name: Path<T>;
  label?: string;
}

export default function AppInput<
  T extends FieldValues,
>({
  control,
  name,
  label,
  ...textInputProps
}: Props<T>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({
        field: {
          onChange,
          onBlur,
          value,
        },
        fieldState: { error },
      }) => (
        <View style={styles.container}>
          {label && (
            <Text style={styles.label}>
              {label}
            </Text>
          )}

          <TextInput
            {...textInputProps}
            value={value ?? ''}
            onBlur={onBlur}
            onChangeText={onChange}
            style={[
              styles.input,
              error && styles.inputError,
            ]}
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
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: COLORS.text,
  },

  input: {
    height: 56,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    paddingHorizontal: 16,
    fontSize: 16,
  },

  inputError: {
    borderColor: COLORS.danger,
  },

  error: {
    marginTop: 6,
    color: COLORS.danger,
    fontSize: 13,
  },
});