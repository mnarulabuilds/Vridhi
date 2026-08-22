import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOWS, SIZES } from '@/src/theme';
import { useFinancialSummary } from '@/src/hooks/useFinancialSummary';
import { useTransactions } from '@/src/hooks/useTransactions';
import { useAuth } from '@/src/providers/auth-provider';
import TransactionCard from '@/src/components/transactions/TransactionCard';
import { formatCurrency } from '@/src/utils/currency';
import { monthBounds, shiftMonth } from '@/src/utils/month';
import { useInsights } from '@/src/hooks/useInsights';
import { useNetWorth } from '@/src/hooks/useNetWorth';
import InsightNoticeCard from '@/src/components/insights/InsightNoticeCard';
import NetWorthSpark from '@/src/components/insights/NetWorthSpark';

export default function DashboardScreen() {
  const { user } = useAuth();
  const [month, setMonth] = useState(() => new Date());
  const bounds = monthBounds(month);
  const { data: summary, isLoading: summaryLoading } = useFinancialSummary(bounds.from, bounds.to);
  const { transactions, isLoading: txLoading } = useTransactions({
    from: bounds.from,
    to: bounds.to,
    limit: 8,
  });
  const { data: insights } = useInsights(bounds.from);
  const { data: worth } = useNetWorth(bounds.to);
  const notices = (insights?.notices ?? []).filter((notice) => notice.kind !== 'info').slice(0, 2);

  const income = summary?.income ?? 0;
  const expenses = summary?.expenses ?? 0;
  const cashFlow = summary?.netCashFlow ?? income - expenses;
  const netWorth = worth?.netWorth ?? 0;
  const assets = worth?.assets ?? 0;
  const liabilities = worth?.liabilities ?? 0;

  if (summaryLoading && txLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <LinearGradient colors={[...COLORS.gradientPrimary]} style={styles.hero}>
          <View style={styles.heroTop}>
            <View>
              <Text style={styles.hello}>Hello{user?.name ? `, ${user.name.split(' ')[0]}` : ''}</Text>
              <Text style={styles.heroLabel}>Net worth · {bounds.label}</Text>
            </View>
            <TouchableOpacity onPress={() => router.push('/profile')}>
              <Ionicons name="person-circle-outline" size={36} color="#fff" />
            </TouchableOpacity>
          </View>
          <Text style={styles.heroAmount}>{formatCurrency(netWorth)}</Text>
          <Text style={styles.heroSub}>
            Assets {formatCurrency(assets)} · liabilities {formatCurrency(liabilities)}
          </Text>
          <NetWorthSpark history={worth?.history ?? []} />
          <View style={styles.monthNav}>
            <TouchableOpacity onPress={() => setMonth((value) => shiftMonth(value, -1))}>
              <Ionicons name="chevron-back" size={22} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.monthLabel}>{bounds.label}</Text>
            <TouchableOpacity onPress={() => setMonth((value) => shiftMonth(value, 1))}>
              <Ionicons name="chevron-forward" size={22} color="#fff" />
            </TouchableOpacity>
          </View>
        </LinearGradient>

        <View style={styles.stats}>
          <Stat label="Income" value={formatCurrency(income)} color={COLORS.success} />
          <Stat label="Expenses" value={formatCurrency(expenses)} color={COLORS.danger} />
          <Stat label="Cash flow" value={formatCurrency(cashFlow)} color={COLORS.primary} />
        </View>

        {notices.length > 0 ? (
          <>
            <View style={styles.sectionHead}>
              <Text style={styles.sectionTitle}>Worth a look</Text>
              <TouchableOpacity onPress={() => router.push('/(app)/(tabs)/analytics')}>
                <Text style={styles.link}>Insights</Text>
              </TouchableOpacity>
            </View>
            {notices.map((notice) => (
              <InsightNoticeCard key={notice.title} notice={notice} />
            ))}
          </>
        ) : null}

        <View style={styles.sectionHead}>
          <Text style={styles.sectionTitle}>Recent transactions</Text>
          <TouchableOpacity onPress={() => router.push('/(app)/(tabs)/transactions')}>
            <Text style={styles.link}>See all</Text>
          </TouchableOpacity>
        </View>
        {transactions.length === 0 ? (
          <Text style={styles.empty}>No transactions this month. Add one to start tracking.</Text>
        ) : (
          transactions.map((transaction) => (
            <TransactionCard
              key={transaction.id}
              transaction={transaction}
              onPress={() => router.push(`/transactions/${transaction.id}`)}
            />
          ))
        )}
      </ScrollView>
      <TouchableOpacity style={styles.fab} onPress={() => router.push('/transactions/quick')}>
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

function Stat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scroll: { padding: SIZES.padding, paddingBottom: 120 },
  hero: { borderRadius: 24, padding: 20, marginBottom: 16, ...SHADOWS.medium },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  hello: { color: '#fff', fontSize: 18, fontWeight: '700' },
  heroLabel: { color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  heroAmount: { color: '#fff', fontSize: 32, fontWeight: '800', marginTop: 16 },
  heroSub: { color: 'rgba(255,255,255,0.85)', marginTop: 6 },
  monthNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 18,
  },
  monthLabel: { color: '#fff', fontWeight: '700' },
  stats: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  stat: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 12,
    ...SHADOWS.small,
  },
  statLabel: { color: COLORS.textLight, fontSize: 12 },
  statValue: { fontWeight: '800', marginTop: 6, fontSize: 13 },
  sectionHead: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text },
  link: { color: COLORS.primary, fontWeight: '700' },
  empty: { color: COLORS.textLight, marginBottom: 20 },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.medium,
  },
});
