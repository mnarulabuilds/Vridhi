import { Ionicons } from '@expo/vector-icons';

export const ACCOUNT_LABELS: Record<string, string> = {
  CASH: 'Cash',
  SAVINGS: 'Savings',
  CURRENT: 'Current',
  CREDIT_CARD: 'Credit card',
  WALLET: 'Wallet',
  INVESTMENT: 'Investment',
  LOAN: 'Loan',
  OTHER_ASSET: 'Other asset',
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
  LOAN: 'document-text-outline',
  OTHER_ASSET: 'diamond-outline',
};

export const ACCOUNT_COLORS = [
  '#2563EB',

  '#059669',

  '#9333EA',

  '#EA580C',

  '#DB2777',

  '#0891B2',
];