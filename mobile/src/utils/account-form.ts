import type { Account } from '@/src/api/accounts.api';
import type { AccountFormSchema } from '@/src/validation/account.schema';
import type { UpdateAccountRequest } from '@/src/api/accounts.api';

export function accountToFormValues(account: Account): AccountFormSchema {
  return {
    name: account.name,
    type: account.type,
    openingBalance: Number(account.openingBalance),
    currency: account.currency as AccountFormSchema['currency'],
    icon: account.icon ?? '',
    color: account.color ?? '',
  };
}

export function formValuesToUpdatePayload(values: AccountFormSchema): UpdateAccountRequest {
  return {
    name: values.name.trim(),
    type: values.type,
    openingBalance: values.openingBalance,
    currency: values.currency,
    icon: values.icon?.trim() ? values.icon.trim() : undefined,
    color: values.color?.trim() ? values.color.trim() : undefined,
  };
}
