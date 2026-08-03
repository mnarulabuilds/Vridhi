import React from 'react';
import { router } from 'expo-router';

import TransactionForm from '@/src/components/transactions/TransactionForm';

import { useAccounts } from '@/src/hooks/useAccounts';
import { useTransactions } from '@/src/hooks/useTransactions';

import { TransactionFormValues } from '@/src/validation/transaction.schema';
import { confirmAlert } from '@/src/utils/confirmAlert';
import ScreenContainer from '@/src/components/ScreenContainer';

export default function CreateTransactionScreen() {
  const {
    accounts,
    loading: accountsLoading
  } = useAccounts();

  const {
    createTransaction,
    creating,
  } = useTransactions();

  async function handleSubmit(
    values: TransactionFormValues,
  ) {
    try {
      await createTransaction(values);

      confirmAlert(
        'Success',
        'Transaction created successfully.',
      );

      router.back();
    } catch (error: any) {
      confirmAlert(
        'Error',
        error?.response?.data?.message ??
          'Unable to create transaction.',
      );
    }
  }

  if (accountsLoading) {
    return null;
  }

  return (
    <ScreenContainer
      title="Add Transaction"
      scrollable
    >
      <TransactionForm
        accounts={accounts}
        loading={creating}
        submitText="Create Transaction"
        onSubmit={handleSubmit}
      />
    </ScreenContainer>
  );
}