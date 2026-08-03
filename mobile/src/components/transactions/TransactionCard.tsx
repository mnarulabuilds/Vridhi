import React from 'react';

import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';

import {
  COLORS,
  SHADOWS,
} from '@/src/theme';

import { Transaction } from '@/src/api/transactions.api';

import { formatCurrency } from '@/src/utils/currency';
import { relativeDate } from '@/src/utils/date';

interface Props {
  transaction: Transaction;

  onPress(): void;
}

const TYPE_COLORS = {
  INCOME: '#22C55E',

  EXPENSE: '#EF4444',

  TRANSFER: '#2563EB',
};

const CATEGORY_ICONS: Record<
  string,
  keyof typeof Ionicons.glyphMap
> = {
  Salary: 'cash-outline',

  Bonus: 'gift-outline',

  Food: 'restaurant-outline',

  Shopping: 'bag-outline',

  Transport: 'car-outline',

  Bills: 'receipt-outline',

  Health: 'medical-outline',

  Entertainment: 'film-outline',

  Investment: 'trending-up-outline',

  Travel: 'airplane-outline',

  Other: 'wallet-outline',
};

export default function TransactionCard({
  transaction,
  onPress,
}: Props) {
  const color =
    TYPE_COLORS[
      transaction.type
    ];

  const icon =
    CATEGORY_ICONS[
      transaction.category
    ] ??
    'wallet-outline';

  const prefix =
    transaction.type === 'EXPENSE'
      ? '-'
      : '+';

  return (
    <Pressable
      onPress={onPress}
      style={styles.card}
    >
      <View style={styles.left}>
        <View
          style={[
            styles.icon,
            {
              backgroundColor:
                color + '20',
            },
          ]}
        >
          <Ionicons
            name={icon}
            size={22}
            color={color}
          />
        </View>

        <View style={styles.info}>
          <Text style={styles.title}>
            {transaction.title}
          </Text>

          {!!transaction.merchant && (
            <Text
              style={styles.merchant}
            >
              {transaction.merchant}
            </Text>
          )}

          <Text style={styles.date}>
            {relativeDate(
              transaction.transactionDate,
            )}
          </Text>
        </View>
      </View>

      <View
        style={styles.right}
      >
        <Text
          style={[
            styles.amount,
            {
              color,
            },
          ]}
        >
          {prefix}
          {formatCurrency(
            Number(
              transaction.amount,
            ),
          )}
        </Text>

        <View
          style={styles.badge}
        >
          <Text
            style={
              styles.badgeText
            }
          >
            {
              transaction.category
            }
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',

    justifyContent:
      'space-between',

    alignItems: 'center',

    backgroundColor:
      COLORS.surface,

    borderRadius: 18,

    padding: 18,

    marginBottom: 14,

    ...SHADOWS.medium,
  },

  left: {
    flexDirection: 'row',

    flex: 1,
  },

  icon: {
    width: 52,

    height: 52,

    borderRadius: 14,

    justifyContent: 'center',

    alignItems: 'center',
  },

  info: {
    marginLeft: 14,

    justifyContent: 'center',

    flex: 1,
  },

  title: {
    fontSize: 17,

    fontWeight: '700',

    color: COLORS.text,
  },

  merchant: {
    marginTop: 3,

    color: COLORS.textLight,
  },

  date: {
    marginTop: 5,

    fontSize: 12,

    color: COLORS.textDark,
  },

  right: {
    alignItems: 'flex-end',
  },

  amount: {
    fontSize: 18,

    fontWeight: '800',
  },

  badge: {
    marginTop: 8,

    paddingHorizontal: 10,

    paddingVertical: 5,

    borderRadius: 20,

    backgroundColor:
      COLORS.primaryDark,
  },

  badgeText: {
    fontSize: 11,

    fontWeight: '600',

    color: COLORS.textLight,
  },
});