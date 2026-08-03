import React from 'react';

import {
  Alert,
  ActivityIndicator,
} from 'react-native';

import {
  router,
  useLocalSearchParams,
} from 'expo-router';

import TransactionForm from '@/src/components/transactions/TransactionForm';

import { useAccounts } from '@/src/hooks/useAccounts';
import { useTransaction } from '@/src/hooks/useTransaction';
import { useTransactions } from '@/src/hooks/useTransactions';

import { TransactionFormValues } from '@/src/validation/transaction.schema';
import ScreenContainer from '@/src/components/ScreenContainer';
import { confirmAlert } from '@/src/utils/confirmAlert';

export default function EditTransactionScreen() {
  const { id } = useLocalSearchParams<{
    id: string;
  }>();

  const {
    data: transaction,
    isLoading,
  } = useTransaction(id);

  const {
    accounts,
    loading: accountsLoading,
  } = useAccounts();

  const {
    updateTransaction,
    updating,
  } = useTransactions();

  async function handleSubmit(
    values: TransactionFormValues,
  ) {
    try {
      await updateTransaction({
        id,
        payload: values,
      });

      router.push('/transactions');
    } catch (error: any) {
      confirmAlert(
        'Error',
        error?.response?.data?.message ??
          'Unable to update transaction.',
      );
    }
  }

  if (isLoading || accountsLoading) {
    return (
      <ScreenContainer title="Edit Transaction">
        <ActivityIndicator />
      </ScreenContainer>
    );
  }

  if (!transaction) {
    return (
      <ScreenContainer title="Edit Transaction">
        Transaction not found.
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer
      title="Edit Transaction"
      scrollable
    >
      <TransactionForm
        accounts={accounts}
        loading={updating}
        submitText="Save Changes"
        defaultValues={{
          title: transaction.title,
          amount: Number(transaction.amount),
          type: transaction.type,
          category: transaction.category,
          merchant:
            transaction.merchant ?? '',
          notes:
            transaction.notes ?? '',
          accountId:
            transaction.accountId,
          transactionDate:
            transaction.transactionDate,
        }}
        onSubmit={handleSubmit}
      />
    </ScreenContainer>
  );
}