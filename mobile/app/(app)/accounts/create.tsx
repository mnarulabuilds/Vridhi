import React from 'react';

import { router } from 'expo-router';

import ScreenContainer from '@/src/components/ScreenContainer';

import { useAccounts } from '@/src/hooks/useAccounts';

import { type AccountFormSchema } from '@/src/validation/account.schema';

import AccountForm from '@/src/components/accounts/AccountForm';
import { confirmAlert } from '@/src/utils/confirmAlert';

export default function CreateAccountScreen() {
  const {
    createAccount,
  } = useAccounts();

  async function onSubmit(
    values: AccountFormSchema,
  ) {
    try {
      await createAccount(values);

      router.back();
    } catch (error: any) {
      confirmAlert(
        'Unable to create account',
        error?.response?.data?.message ??
          error?.message ??
          'Something went wrong.',
      );
    }
  }

  return (
    <ScreenContainer>
      <AccountForm
        submitText="Create Account"
        onSubmit={onSubmit}
      />
    </ScreenContainer>
  );
}