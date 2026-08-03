import React, { useEffect } from 'react';

import {
  View,
  StyleSheet,
} from 'react-native';

import {
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

      <AppInput
        label="Title"
        control={control}
        name="title"
      />


      <AppInput
        label="Amount"
        keyboardType="decimal-pad"
        control={control}
        name="amount"
      />

      <AppSelect
        label="Type"
        data={
          TRANSACTION_TYPES
        }
        control={control}
        name="type"
      />

      <AppSelect
        label="Category"
        control={control}
        name="category"
        data={
          categoryOptions
        }
      />


      <AppSelect
        label="Account"
        control={control}
        name="accountId"
        data={accounts.map(
          account => ({
            label:
              account.name,
            value:
              account.id,
          }),
        )}
      />


      <AppInput
        label="Merchant"
        control={control}
        name="merchant"
      />


      <AppInput
        label="Notes"
        multiline
        numberOfLines={4}
        control={control}
        name="notes"
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