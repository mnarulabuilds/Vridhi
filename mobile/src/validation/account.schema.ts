import { z } from 'zod';
import { CURRENCIES } from '@/src/constants/currencies';

export const ACCOUNT_TYPES = [
  'CASH',
  'SAVINGS',
  'CURRENT',
  'WALLET',
  'INVESTMENT',
  'OTHER_ASSET',
  'CREDIT_CARD',
  'LOAN',
] as const;

export const ACCOUNT_TYPE_OPTIONS: Array<{ label: string; value: (typeof ACCOUNT_TYPES)[number] }> = [
  { label: 'Cash', value: 'CASH' },
  { label: 'Savings', value: 'SAVINGS' },
  { label: 'Current / checking', value: 'CURRENT' },
  { label: 'Wallet', value: 'WALLET' },
  { label: 'Investment', value: 'INVESTMENT' },
  { label: 'Gold / other asset', value: 'OTHER_ASSET' },
  { label: 'Credit card', value: 'CREDIT_CARD' },
  { label: 'Loan', value: 'LOAN' },
];

export const LIABILITY_ACCOUNT_TYPES: readonly string[] = ['CREDIT_CARD', 'LOAN'];

export const accountSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Account name is required')
    .max(50, 'Account name is too long'),

  type: z.enum(ACCOUNT_TYPES, {
    message: 'Please select an account type',
  }),

  openingBalance: z.coerce
    .number()
    .min(
      0,
      'Opening balance cannot be negative',
    ),

  currency: z.enum(CURRENCIES, {
    message: 'Please select a currency',
  }),

  icon: z
    .string()
    .optional(),

  color: z
    .string()
    .optional(),
});

export type AccountFormSchema = z.infer<
  typeof accountSchema
>;