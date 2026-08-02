import { z } from 'zod';

export const ACCOUNT_TYPES = [
  'CASH',
  'SAVINGS',
  'CURRENT',
  'CREDIT_CARD',
  'WALLET',
  'INVESTMENT',
] as const;

export const CURRENCIES = [
  'INR',
  'USD',
  'EUR',
  'GBP',
] as const;

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