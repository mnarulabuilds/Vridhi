import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PieChart } from 'react-native-chart-kit';
import { COLORS, SIZES } from '@/src/theme';
import { useFinancialSummary } from '@/src/hooks/useFinancialSummary';
import { formatCurrency } from '@/src/utils/currency';
import { monthBounds, shiftMonth } from '@/src/utils/month';
import { TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const width = Dimensions.get('window').width;
const PALETTE = ['#6366f1', '#ec4899', '#10b981', '#f59e0b', '#06b6d4', '#8b5cf6', '#ef4444'];

export default function AnalyticsScreen() {
  const [month, setMonth] = useState(() => new Date());
  const bounds = monthBounds(month);
  const { data, isLoading } = useFinancialSummary(bounds.from, bounds.to);

  const pie = useMemo(() => {
    const entries = Object.entries(data?.spendingByCategory ?? {});
    return entries.map(([name, amount], index) => ({
      name,
      amount,
      color: PALETTE[index % PALETTE.length],
      legendFontColor: COLORS.text,
      legendFontSize: 12,
    }));
  }, [data]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.monthNav}>
          <TouchableOpacity onPress={() => setMonth((value) => shiftMonth(value, -1))}>
            <Ionicons name="chevron-back" size={22} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.title}>Insights · {bounds.label}</Text>
          <TouchableOpacity onPress={() => setMonth((value) => shiftMonth(value, 1))}>
            <Ionicons name="chevron-forward" size={22} color={COLORS.text} />
          </TouchableOpacity>
        </View>
        {isLoading ? (
          <ActivityIndicator color={COLORS.primary} />
        ) : (
          <>
            <Text style={styles.metric}>
              Spent {formatCurrency(data?.expenses ?? 0)} of {formatCurrency(data?.income ?? 0)} income
            </Text>
            {pie.length > 0 ? (
              <PieChart
                data={pie}
                width={width - 24}
                height={220}
                accessor="amount"
                backgroundColor="transparent"
                paddingLeft="12"
                chartConfig={{
                  color: () => COLORS.primary,
                  labelColor: () => COLORS.text,
                }}
                absolute
              />
            ) : (
              <Text style={styles.empty}>No categorized expenses this month.</Text>
            )}
            <Text style={styles.section}>Budgets</Text>
            {(data?.budgetVsActual ?? []).length === 0 ? (
              <Text style={styles.empty}>Set category budgets in Settings.</Text>
            ) : (
              (data?.budgetVsActual ?? []).map((row) => {
                const pct = Math.min(row.utilization, 1);
                return (
                  <View key={row.categoryId} style={styles.budget}>
                    <View style={styles.budgetRow}>
                      <Text style={styles.budgetName}>{row.categoryName}</Text>
                      <Text style={styles.budgetAmt}>
                        {formatCurrency(row.spent)} / {formatCurrency(row.planned)}
                      </Text>
                    </View>
                    <View style={styles.bar}>
                      <View
                        style={[
                          styles.fill,
                          {
                            width: `${pct * 100}%`,
                            backgroundColor: pct >= 1 ? COLORS.danger : pct >= 0.75 ? COLORS.warning : COLORS.success,
                          },
                        ]}
                      />
                    </View>
                  </View>
                );
              })
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  scroll: { padding: SIZES.padding, paddingBottom: 40 },
  monthNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  title: { fontSize: 18, fontWeight: '800', color: COLORS.text },
  metric: { color: COLORS.textLight, marginBottom: 12 },
  empty: { color: COLORS.textLight, marginVertical: 16 },
  section: { fontSize: 18, fontWeight: '700', marginTop: 8, marginBottom: 12, color: COLORS.text },
  budget: { marginBottom: 14 },
  budgetRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  budgetName: { fontWeight: '600', color: COLORS.text },
  budgetAmt: { color: COLORS.textLight, fontSize: 12 },
  bar: { height: 8, backgroundColor: COLORS.primaryLight, borderRadius: 8, overflow: 'hidden' },
  fill: { height: 8, borderRadius: 8 },
});
