import { z } from 'zod';

export const transactionSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'Title is required.'),

  amount: z.coerce
    .number()
    .positive('Amount must be greater than zero.'),

  type: z.enum([
    'INCOME',
    'EXPENSE',
    'TRANSFER',
  ]),

  category: z
    .string()
    .min(1, 'Category is required.'),

  merchant: z.string().optional(),

  notes: z.string().optional(),

  accountId: z
    .string()
    .min(1, 'Please select an account.'),

  transactionDate: z.string(),
});

export type TransactionFormValues =
  z.infer<typeof transactionSchema>;