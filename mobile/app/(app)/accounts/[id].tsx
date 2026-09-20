import React from 'react';

import {
    View,
    StyleSheet
} from 'react-native';

import { router, useLocalSearchParams } from 'expo-router';

import ScreenContainer from '@/src/components/ScreenContainer';

import { useAccounts } from '@/src/hooks/useAccounts';

import { type AccountFormSchema } from '@/src/validation/account.schema';

import AccountForm from '@/src/components/accounts/AccountForm';
import { useAccount } from '@/src/hooks/useAccount';
import { ActivityIndicator, Text } from 'react-native-paper';
import PrimaryButton from '@/src/components/form/PrimaryButton';
import { confirmAlert } from '@/src/utils/confirmAlert';
import { getApiErrorMessage } from '@/src/api/error';
import { accountToFormValues, formValuesToUpdatePayload } from '@/src/utils/account-form';

export default function UpdateAccountScreen() {
    const {
        updateAccount,
        updating,
        archiveAccount,
    } = useAccounts();

    const { id } = useLocalSearchParams<{ id: string | string[] }>();

    const accountId = Array.isArray(id) ? (id[0] ?? '') : (id ?? '');

    const { account, loading, error } = useAccount(accountId);

    async function onSubmit(
        values: AccountFormSchema,
    ) {
        try {
            await updateAccount({
                id: accountId,
                payload: formValuesToUpdatePayload(values),
            });

            router.back();
        } catch (error: unknown) {
            confirmAlert(
                'Unable to update account',
                getApiErrorMessage(error, 'Something went wrong.'),
            );
        }
    }

    async function handleArchive() {
        try {
            await archiveAccount(accountId);

            confirmAlert(
                'Success',
                'Account archived successfully.',
            );

            router.replace('/accounts');
        } catch (error: unknown) {
            confirmAlert(
                'Unable to archive account',
                getApiErrorMessage(error, 'Something went wrong.'),
            );
        }
    }

    const accountBreadcrumbs = [
        { label: 'Accounts', href: '/accounts' },
        { label: 'Edit' },
    ];

    if (!accountId) {
        return (
            <ScreenContainer scrollable title="Edit account" breadcrumbs={accountBreadcrumbs}>
                <Text>Invalid account.</Text>
            </ScreenContainer>
        );
    }

    if (loading) {
        return (
            <ScreenContainer scrollable title="Edit account" breadcrumbs={accountBreadcrumbs}>
                <ActivityIndicator />
            </ScreenContainer>
        );
    }

    if (error || !account?.id) {
        return (
            <ScreenContainer scrollable title="Edit account" breadcrumbs={accountBreadcrumbs}>
                <Text>{error ? getApiErrorMessage(error, 'Could not load account.') : 'Account not found.'}</Text>
            </ScreenContainer>
        );
    }

    return (
        <ScreenContainer
            scrollable
            title="Edit account"
            breadcrumbs={accountBreadcrumbs}
        >
            <AccountForm
                key={account.id}
                defaultValues={accountToFormValues(account)}
                submitText="Save Changes"
                loading={updating}
                onSubmit={onSubmit}
            />

            <View style={styles.mt2}>
                <PrimaryButton
                    title='Archive Account'
                    onPress={handleArchive}
                />
            </View>

        </ScreenContainer>
    );
}

const styles = StyleSheet.create({
  mt2: {
    marginTop: 16
  }
});
