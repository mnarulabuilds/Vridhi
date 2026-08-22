import { z } from 'zod';

export const transactionSchema = z
  .object({
    title: z.string().trim().min(1, 'Title is required.'),
    amount: z.coerce.number().positive('Amount must be greater than zero.'),
    type: z.enum(['INCOME', 'EXPENSE', 'TRANSFER']),
    categoryId: z.string().optional(),
    merchant: z.string().optional(),
    notes: z.string().optional(),
    accountId: z.string().min(1, 'Please select an account.'),
    transferToAccountId: z.string().optional(),
    transactionDate: z.string(),
  })
  .superRefine((values, ctx) => {
    if (values.type === 'TRANSFER') {
      if (!values.transferToAccountId) {
        ctx.addIssue({
          code: 'custom',
          path: ['transferToAccountId'],
          message: 'Choose a destination account.',
        });
      } else if (values.transferToAccountId === values.accountId) {
        ctx.addIssue({
          code: 'custom',
          path: ['transferToAccountId'],
          message: 'Destination must be a different account.',
        });
      }
    } else if (!values.categoryId) {
      ctx.addIssue({
        code: 'custom',
        path: ['categoryId'],
        message: 'Category is required.',
      });
    }
  });

export type TransactionFormValues = z.infer<typeof transactionSchema>;
