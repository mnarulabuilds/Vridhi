import React from 'react';

import {
  Alert,
  StyleSheet,
  View,
} from 'react-native';

import {
  Controller,
  Resolver,
  useForm,
} from 'react-hook-form';

import {
  zodResolver,
} from '@hookform/resolvers/zod';

import AppInput from '@/src/components/form/AppInput';
import AppSelect from '@/src/components/form/AppSelect';
import PrimaryButton from '@/src/components/form/PrimaryButton';

import {
  ACCOUNT_TYPE_OPTIONS,
  accountSchema,
  AccountFormSchema as AccountFormValues,
  LIABILITY_ACCOUNT_TYPES,
} from '@/src/validation/account.schema';
import CurrencySelect from '@/src/components/form/CurrencySelect';
import type { CurrencyCode } from '@/src/constants/currencies';
import { confirmAlert } from '@/src/utils/confirmAlert';
import IconPicker from './IconPicker';
import ColorPicker from './ColorPicker';
import { Text } from 'react-native-paper';

interface Props {
  defaultValues?: Partial<AccountFormValues>;

  loading?: boolean;

  submitText: string;

  onSubmit(
    values: AccountFormValues,
  ): Promise<void>;
}

export default function AccountForm({
  defaultValues,
  loading = false,
  submitText,
  onSubmit,
}: Props) {
  const {
    control,
    handleSubmit,
    watch,
    formState: {
      isSubmitting,
    },
  } = useForm<AccountFormValues>({
    resolver: zodResolver(accountSchema) as Resolver<AccountFormValues>,

    defaultValues: {
      name: '',

      type: 'SAVINGS',

      openingBalance: 0,

      currency: 'INR',

      icon: '',

      color: '',

      ...defaultValues,
    },
  });

  const selectedType = watch('type');
  const isLiability = LIABILITY_ACCOUNT_TYPES.includes(selectedType);

  async function submit(
    values: AccountFormValues,
  ) {
    try {
      await onSubmit(values);
    } catch (error: any) {
      confirmAlert(
        'Error',
        error?.response?.data?.message ??
        error?.message ??
        'Something went wrong.',
      );
    }
  }

  return (
    <View style={styles.container}>

      <Text style={styles.sectionTitle}>
        Account Icon
      </Text>

      <Controller
        control={control}
        name="icon"
        render={({ field }) => (
          <IconPicker
            value={field.value}
            onChange={field.onChange}
          />
        )}
      />

      <Text style={styles.sectionTitle}>
        Account Color
      </Text>

      <Controller
        control={control}
        name="color"
        render={({ field }) => (
          <ColorPicker
            value={field.value}
            onChange={field.onChange}
          />
        )}
      />



      <AppInput
        control={control}
        name="name"
        label="Account Name"
        placeholder="HDFC Savings"
      />

      <AppSelect
        control={control}
        name="type"
        label="Account Type"
        placeholder="Select account type"
        data={ACCOUNT_TYPE_OPTIONS}
      />

      <AppInput
        control={control}
        name="openingBalance"
        label={isLiability ? 'Amount currently owed' : 'Opening Balance'}
        keyboardType="numeric"
        placeholder="0"
      />

      <Controller
        control={control}
        name="currency"
        render={({ field }) => (
          <CurrencySelect
            label="Currency"
            value={field.value}
            onChange={(code) => field.onChange(code as CurrencyCode)}
          />
        )}
      />

      <PrimaryButton
        title={submitText}
        loading={
          loading || isSubmitting
        }
        onPress={handleSubmit(
          submit
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 18,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  }
});
