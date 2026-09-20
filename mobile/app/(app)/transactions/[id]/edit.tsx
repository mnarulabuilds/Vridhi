import React from 'react';
import { ActivityIndicator } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import TransactionForm from '@/src/components/transactions/TransactionForm';
import { useAccounts } from '@/src/hooks/useAccounts';
import { useTransaction } from '@/src/hooks/useTransaction';
import { useTransactions } from '@/src/hooks/useTransactions';
import { useCategories } from '@/src/hooks/useCategories';
import { TransactionFormValues } from '@/src/validation/transaction.schema';
import ScreenContainer from '@/src/components/ScreenContainer';
import { confirmAlert } from '@/src/utils/confirmAlert';
import { getApiErrorMessage } from '@/src/api/error';

export default function EditTransactionScreen() {
  const { id } = useLocalSearchParams<{ id: string | string[] }>();
  const transactionId = Array.isArray(id) ? (id[0] ?? '') : (id ?? '');
  const { data: transaction, isLoading } = useTransaction(transactionId);
  const { accounts, loading: accountsLoading } = useAccounts();
  const { categories } = useCategories();
  const { updateTransaction, updating } = useTransactions();

  async function handleSubmit(values: TransactionFormValues) {
    try {
      await updateTransaction({
        id: transactionId,
        payload: {
          title: values.title,
          amount: values.amount,
          type: values.type,
          accountId: values.accountId,
          transactionDate: values.transactionDate,
          merchant: values.merchant,
          notes: values.notes,
          categoryId: values.type === 'TRANSFER' ? undefined : values.categoryId,
          transferToAccountId: values.type === 'TRANSFER' ? values.transferToAccountId : undefined,
        },
      });
      router.back();
    } catch (error: unknown) {
      confirmAlert('Error', getApiErrorMessage(error, 'Unable to update transaction.'));
    }
  }

  if (isLoading || accountsLoading) {
    return (
      <ScreenContainer
        title="Edit transaction"
        breadcrumbs={[
          { label: 'Transactions', href: '/(app)/(tabs)/transactions' },
          { label: 'Edit' },
        ]}
      >
        <ActivityIndicator />
      </ScreenContainer>
    );
  }

  if (!transaction) {
    return (
      <ScreenContainer
        title="Edit transaction"
        breadcrumbs={[
          { label: 'Transactions', href: '/(app)/(tabs)/transactions' },
          { label: 'Edit' },
        ]}
      >
        Transaction not found.
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer
      title="Edit transaction"
      scrollable
      breadcrumbs={[
        { label: 'Transactions', href: '/(app)/(tabs)/transactions' },
        { label: 'Edit' },
      ]}
    >
      <TransactionForm
        accounts={accounts}
        categories={categories}
        loading={updating}
        submitText="Save Changes"
        suggestCategory={false}
        defaultValues={{
          title: transaction.title,
          amount: Number(transaction.amount),
          type: transaction.type,
          categoryId: transaction.categoryId ?? '',
          merchant: transaction.merchant ?? '',
          notes: transaction.notes ?? '',
          accountId: transaction.accountId,
          transferToAccountId: transaction.transferToAccountId ?? '',
          transactionDate: transaction.transactionDate,
        }}
        onSubmit={handleSubmit}
      />
    </ScreenContainer>
  );
}
