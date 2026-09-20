import { useQuery } from '@tanstack/react-query';
import { ReportsApi } from '@/src/api/reports.api';
import { usePreferredCurrency } from '@/src/hooks/useReportingCurrency';

export function useFinancialSummary(from: string, to: string) {
  const preferredCurrency = usePreferredCurrency();
  return useQuery({
    queryKey: ['financial-summary', from, to, preferredCurrency],
    queryFn: () => ReportsApi.summary(from, to),
    enabled: Boolean(from && to),
  });
}
