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

export default function UpdateAccountScreen() {
    const {
        updateAccount,
        updating,
        archiveAccount,
    } = useAccounts();

    const { id } = useLocalSearchParams();

    const accountId = typeof id === 'string' ? id : id.join("")

    const { account, loading } = useAccount(accountId);

    async function onSubmit(
        values: AccountFormSchema,
    ) {
        try {
            await updateAccount({
                id: accountId,
                payload: values
            });

            router.push('/accounts');
        } catch (error: any) {
            confirmAlert(
                'Unable to create account',
                error?.response?.data?.message ??
                error?.message ??
                'Something went wrong.',
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

            router.push('/accounts');
        } catch (error: any) {
            confirmAlert(
                'Unable to create account',
                error?.response?.data?.message ??
                error?.message ??
                'Something went wrong.',
            );
        }
    }

    if (loading) {
        return <ActivityIndicator />;
    }

    if (!account) {
        return (
            <Text>Account not found.</Text>
        );
    }

    return (
        <ScreenContainer>
            <AccountForm
                defaultValues={account}
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
