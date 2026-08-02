import { Ionicons } from '@expo/vector-icons';

export const ACCOUNT_LABELS = {
  CASH: 'Cash',

  SAVINGS: 'Savings Account',

  CURRENT: 'Current Account',

  CREDIT_CARD: 'Credit Card',

  WALLET: 'Wallet',

  INVESTMENT: 'Investment',
};

export const ACCOUNT_ICONS: Record<
  string,
  keyof typeof Ionicons.glyphMap
> = {
  CASH: 'cash-outline',

  SAVINGS: 'wallet-outline',

  CURRENT: 'business-outline',

  CREDIT_CARD: 'card-outline',

  WALLET: 'wallet',

  INVESTMENT: 'trending-up-outline',
};

export const ACCOUNT_COLORS = [
  '#2563EB',

  '#059669',

  '#9333EA',

  '#EA580C',

  '#DB2777',

  '#0891B2',
];