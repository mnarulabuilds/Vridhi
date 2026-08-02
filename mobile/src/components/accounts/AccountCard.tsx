import React from 'react';

import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';

import { LinearGradient } from 'expo-linear-gradient';

import {
  ACCOUNT_ICONS,
  ACCOUNT_LABELS,
} from '@/src/constants/accounts';

import {
  COLORS,
  SHADOWS,
} from '@/src/theme';

import { formatCurrency } from '@/src/utils/currency';
import { relativeDate } from '@/src/utils/date';

import { Account } from '@/src/api/accounts.api';

interface Props {
  account: Account;

  onPress(): void;

  onLongPress?(): void;
}

export default function AccountCard({
  account,
  onPress,
  onLongPress,
}: Props) {
  const accent =
    account.color ??
    COLORS.primaryDark;

  return (
    <TouchableOpacity
      activeOpacity={0.92}
      onPress={onPress}
      onLongPress={onLongPress}
    >
      <LinearGradient
        colors={[
          accent,
          COLORS.primaryLight,
        ]}
        style={styles.card}
      >
        <View style={styles.header}>
          <View style={styles.left}>
            <View style={styles.icon}>
              <Ionicons
                name={
                  ACCOUNT_ICONS[
                    account.type
                  ]
                }
                size={26}
                color="#fff"
              />
            </View>

            <View>
              <Text style={styles.name}>
                {account.name}
              </Text>

              <Text
                style={styles.updated}
              >
                Updated{' '}
                {relativeDate(
                  account.updatedAt,
                )}
              </Text>
            </View>
          </View>

          <View style={styles.badge}>
            <Text
              style={styles.badgeText}
            >
              {
                ACCOUNT_LABELS[
                  account.type
                ]
              }
            </Text>
          </View>
        </View>

        <View
          style={styles.balanceSection}
        >
          <Text style={styles.label}>
            Current Balance
          </Text>

          <Text style={styles.balance}>
            {formatCurrency(
              Number(
                account.openingBalance,
              ),
              account.currency,
            )}
          </Text>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 22,
    padding: 22,
    marginBottom: 18,
    ...SHADOWS.large,
  },

  header: {
    flexDirection: 'row',
    justifyContent:
      'space-between',
    alignItems: 'flex-start',
  },

  left: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },

  icon: {
    width: 54,
    height: 54,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor:
      COLORS.primary,
    marginRight: 14,
  },

  name: {
    color: COLORS.textDark,
    fontSize: 24,
    fontWeight: '700',
  },

  updated: {
    marginTop: 4,
    color:
      COLORS.textDark,
    fontSize: 14,
  },

  badge: {
    backgroundColor:
      COLORS.primaryDark,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },

  badgeText: {
    color: COLORS.textDark,
    fontWeight: '600',
    fontSize: 14,
  },

  balanceSection: {
    marginTop: 30,
  },

  label: {
    color:
      COLORS.textDark,
    fontSize: 16,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },

  balance: {
    marginTop: 8,
    color: COLORS.textDark,
    fontSize: 32,
    fontWeight: '800',
  },
});