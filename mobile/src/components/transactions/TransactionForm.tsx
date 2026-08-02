import React, { useEffect } from 'react';

import {
  View,
  StyleSheet,
} from 'react-native';

import {
  Controller,
  useForm,
} from 'react-hook-form';

import { zodResolver } from '@hookform/resolvers/zod';

import {
  Account,
} from '@/src/api/accounts.api';

import AppInput from '@/src/components/form/AppInput';
import AppSelect from '@/src/components/form/AppSelect';
import PrimaryButton from '@/src/components/form/PrimaryButton';
import { TransactionFormValues, transactionSchema } from '@/src/validation/transaction.schema';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '@/src/constants/transactions';


interface Props {
  accounts: Account[];

  defaultValues?: Partial<TransactionFormValues>;

  loading?: boolean;

  submitText?: string;

  onSubmit(
    values: TransactionFormValues,
  ): Promise<void>;
}

const TRANSACTION_TYPES = [
  {
    label: 'Income',
    value: 'INCOME',
  },
  {
    label: 'Expense',
    value: 'EXPENSE',
  },
  {
    label: 'Transfer',
    value: 'TRANSFER',
  },
];

export default function TransactionForm({
  accounts,
  defaultValues,
  loading = false,
  submitText = 'Save Transaction',
  onSubmit,
}: Props) {
  const {
    control,
    handleSubmit,
    watch,
    setValue,
  } = useForm<TransactionFormValues>({
    resolver:
      zodResolver(transactionSchema),

    defaultValues: {
      title: '',

      amount: 0,

      type: 'EXPENSE',

      category: '',

      merchant: '',

      notes: '',

      transactionDate:
        new Date().toISOString(),

      accountId: '',

      ...defaultValues,
    },
  });

  const type = watch('type');

  useEffect(() => {
    setValue('category', '');
  }, [type]);

  const categoryOptions =
    type === 'INCOME'
      ? INCOME_CATEGORIES
      : EXPENSE_CATEGORIES;

  return (
    <View style={styles.container}>
      <Controller
        control={control}
        name="title"
        render={({
          field,
          fieldState,
        }) => (
          <AppInput
            label="Title"
            value={field.value}
            onChangeText={
              field.onChange
            }
            error={
              fieldState.error
                ?.message
            }
          />
        )}
      />

      <Controller
        control={control}
        name="amount"
        render={({
          field,
          fieldState,
        }) => (
          <AppInput
            label="Amount"
            keyboardType="decimal-pad"
            value={
              field.value?.toString() ??
              ''
            }
            onChangeText={text =>
              field.onChange(
                Number(text),
              )
            }
            error={
              fieldState.error
                ?.message
            }
          />
        )}
      />

      <Controller
        control={control}
        name="type"
        render={({ field }) => (
          <AppSelect
            label="Type"
            value={field.value}
            onValueChange={
              field.onChange
            }
            options={
              TRANSACTION_TYPES
            }
          />
        )}
      />

      <Controller
        control={control}
        name="category"
        render={({
          field,
          fieldState,
        }) => (
          <AppSelect
            label="Category"
            value={field.value}
            onValueChange={
              field.onChange
            }
            options={
              categoryOptions
            }
            error={
              fieldState.error
                ?.message
            }
          />
        )}
      />

      <Controller
        control={control}
        name="accountId"
        render={({
          field,
          fieldState,
        }) => (
          <AppSelect
            label="Account"
            value={field.value}
            onValueChange={
              field.onChange
            }
            options={accounts.map(
              account => ({
                label:
                  account.name,
                value:
                  account.id,
              }),
            )}
            error={
              fieldState.error
                ?.message
            }
          />
        )}
      />

      <Controller
        control={control}
        name="merchant"
        render={({
          field,
        }) => (
          <AppInput
            label="Merchant"
            value={field.value}
            onChangeText={
              field.onChange
            }
          />
        )}
      />

      <Controller
        control={control}
        name="notes"
        render={({ field }) => (
          <AppInput
            label="Notes"
            multiline
            numberOfLines={4}
            value={field.value}
            onChangeText={
              field.onChange
            }
          />
        )}
      />

      <PrimaryButton
        title={submitText}
        loading={loading}
        onPress={handleSubmit(
          onSubmit,
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 20,
    paddingBottom: 40,
  },
});