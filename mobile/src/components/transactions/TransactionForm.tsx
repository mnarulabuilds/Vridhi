import React, { useEffect, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import { useForm, Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Account } from '@/src/api/accounts.api';
import { Category } from '@/src/api/categories.api';
import AppInput from '@/src/components/form/AppInput';
import AppSelect from '@/src/components/form/AppSelect';
import PrimaryButton from '@/src/components/form/PrimaryButton';
import { TransactionFormValues, transactionSchema } from '@/src/validation/transaction.schema';

interface Props {
  accounts: Account[];
  categories: Category[];
  defaultValues?: Partial<TransactionFormValues>;
  loading?: boolean;
  submitText?: string;
  onSubmit(values: TransactionFormValues): Promise<void>;
}

const TRANSACTION_TYPES = [
  { label: 'Income', value: 'INCOME' },
  { label: 'Expense', value: 'EXPENSE' },
  { label: 'Transfer', value: 'TRANSFER' },
];

export default function TransactionForm({
  accounts,
  categories,
  defaultValues,
  loading = false,
  submitText = 'Save Transaction',
  onSubmit,
}: Props) {
  const { control, handleSubmit, watch, setValue } = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionSchema) as Resolver<TransactionFormValues>,
    defaultValues: {
      title: '',
      amount: 0,
      type: 'EXPENSE',
      categoryId: '',
      merchant: '',
      notes: '',
      transactionDate: new Date().toISOString(),
      accountId: '',
      transferToAccountId: '',
      ...defaultValues,
    },
  });

  const type = watch('type');
  const accountId = watch('accountId');
  const didMount = useRef(false);

  useEffect(() => {
    if (!didMount.current) {
      didMount.current = true;
      return;
    }
    setValue('categoryId', '');
    setValue('transferToAccountId', '');
  }, [type, setValue]);

  const categoryOptions = categories
    .filter((category) => category.type === type)
    .map((category) => ({ label: category.name, value: category.id }));

  return (
    <View style={styles.container}>
      <AppInput label="Title" control={control} name="title" />
      <AppInput label="Amount" keyboardType="decimal-pad" control={control} name="amount" />
      <AppSelect label="Type" data={TRANSACTION_TYPES} control={control} name="type" />
      {type !== 'TRANSFER' ? (
        <AppSelect label="Category" control={control} name="categoryId" data={categoryOptions} />
      ) : (
        <AppSelect
          label="To account"
          control={control}
          name="transferToAccountId"
          data={accounts
            .filter((account) => account.id !== accountId)
            .map((account) => ({ label: account.name, value: account.id }))}
        />
      )}
      <AppSelect
        label={type === 'TRANSFER' ? 'From account' : 'Account'}
        control={control}
        name="accountId"
        data={accounts.map((account) => ({ label: account.name, value: account.id }))}
      />
      <AppInput label="Merchant" control={control} name="merchant" />
      <AppInput label="Notes" multiline numberOfLines={4} control={control} name="notes" />
      <PrimaryButton title={submitText} loading={loading} onPress={handleSubmit(onSubmit)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 20,
    paddingBottom: 40,
  },
});
