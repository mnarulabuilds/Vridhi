import React, { useState } from 'react';

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
  TouchableOpacity,
  View,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';

interface Props<T extends FieldValues>
  extends Omit<TextInputProps, 'secureTextEntry'> {
  control: Control<T>;
  name: Path<T>;
  label?: string;
}

export default function PasswordInput<
  T extends FieldValues,
>({
  control,
  name,
  label,
  ...textInputProps
}: Props<T>) {
  const [hidden, setHidden] = useState(true);

  return (
    <Controller
      control={control}
      name={name}
      render={({
        field: {
          value,
          onChange,
          onBlur,
        },
        fieldState: { error },
      }) => (
        <View style={styles.container}>
          {label && (
            <Text style={styles.label}>
              {label}
            </Text>
          )}

          <View
            style={[
              styles.inputContainer,
              error && styles.inputError,
            ]}
          >
            <TextInput
              {...textInputProps}
              value={value?.toString() ?? ''}
              onBlur={onBlur}
              onChangeText={onChange}
              secureTextEntry={hidden}
              style={styles.input}
            />

            <TouchableOpacity
              onPress={() =>
                setHidden((prev) => !prev)
              }
              style={styles.iconButton}
              activeOpacity={0.7}
            >
              <Ionicons
                name={
                  hidden
                    ? 'eye-off-outline'
                    : 'eye-outline'
                }
                size={22}
                color="#666"
              />
            </TouchableOpacity>
          </View>

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
    color: '#333',
  },

  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 14,
    backgroundColor: '#FFF',
    paddingHorizontal: 16,
  },

  input: {
    flex: 1,
    fontSize: 16,
  },

  iconButton: {
    padding: 4,
  },

  inputError: {
    borderColor: '#E53935',
  },

  error: {
    marginTop: 6,
    color: '#E53935',
    fontSize: 13,
  },
});