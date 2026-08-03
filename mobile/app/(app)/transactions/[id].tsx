import React from 'react';

import {
  Alert,
  Platform,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {
  router,
  useLocalSearchParams,
} from 'expo-router';


import PrimaryButton from '@/src/components/form/PrimaryButton';

import { useTransactions } from '@/src/hooks/useTransactions';

import { formatCurrency } from '@/src/utils/currency';
import { relativeDate } from '@/src/utils/date';
import ScreenContainer from '@/src/components/ScreenContainer';
import { useTransaction } from '@/src/hooks/useTransaction';

export default function TransactionDetailsScreen() {
  const { id } =
    useLocalSearchParams<{
      id: string;
    }>();

  const {
    deleteTransaction,
    deleting,
  } = useTransactions();

  const {
    data: transaction,
  } = useTransaction(id);

  if (!transaction) {
    return (
      <ScreenContainer>
        <Text>
          Transaction not found.
        </Text>
      </ScreenContainer>
    );
  }

  async function handleDelete() {
    const deleteAction = async () => {
      try {
        await deleteTransaction(id);
        router.back();
      } catch (error: any) {
        Alert.alert(
          'Error',
          error?.response?.data?.message ??
          'Failed to delete transaction.',
        );
      }
    };

    if (Platform.OS === 'web') {
      const confirmed = window.confirm(
        'Are you sure you want to delete this transaction?',
      );

      if (confirmed) {
        await deleteAction();
      }

      return;
    }

    Alert.alert(
      'Delete Transaction',
      'Are you sure you want to delete this transaction?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: deleteAction,
        },
      ],
    );
  }

  return (
    <ScreenContainer
      title="Transaction"
      scrollable
    >
      <Info
        label="Title"
        value={transaction.title}
      />

      <Info
        label="Amount"
        value={formatCurrency(
          Number(
            transaction.amount,
          ),
        )}
      />

      <Info
        label="Type"
        value={transaction.type}
      />

      <Info
        label="Category"
        value={
          transaction.category
        }
      />

      <Info
        label="Merchant"
        value={
          transaction.merchant ??
          '-'
        }
      />

      <Info
        label="Date"
        value={relativeDate(
          transaction.transactionDate,
        )}
      />

      <Info
        label="Notes"
        value={
          transaction.notes ??
          '-'
        }
      />

      <View
        style={styles.buttons}
      >
        <PrimaryButton
          title="Edit"
          onPress={() =>
            router.push(
              `/transactions/${id}/edit`,
            )
          }
        />

        <PrimaryButton
          title="Delete"
          loading={deleting}
          onPress={
            handleDelete
          }
        />
      </View>
    </ScreenContainer>
  );
}

function Info({
  label,
  value,
}: {
  label: string;

  value: string;
}) {
  return (
    <View style={styles.info}>
      <Text style={styles.label}>
        {label}
      </Text>

      <Text style={styles.value}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  info: {
    marginBottom: 24,
  },

  label: {
    color: '#888',

    marginBottom: 6,

    fontSize: 13,
  },

  value: {
    fontSize: 17,

    fontWeight: '600',
  },

  buttons: {
    gap: 16,

    marginTop: 40,
  },
});