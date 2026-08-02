import { z } from 'zod';

/**
 * Login
 */

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'Email is required')
    .email('Please enter a valid email'),

  password: z
    .string()
    .min(8, 'Password must be at least 8 characters'),
});

export type LoginForm = z.infer<typeof loginSchema>;

/**
 * Register
 */

export const registerSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, 'Name must be at least 2 characters'),

    email: z
      .string()
      .trim()
      .min(1, 'Email is required')
      .email('Please enter a valid email'),

    password: z
      .string()
      .min(8, 'Password must be at least 8 characters'),

    confirmPassword: z
      .string()
      .min(8, 'Confirm your password'),
  })
  .refine(
    (data) => data.password === data.confirmPassword,
    {
      message: 'Passwords do not match',
      path: ['confirmPassword'],
    },
  );

export type RegisterForm = z.infer<
  typeof registerSchema
>;