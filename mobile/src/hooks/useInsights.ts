import { useQuery } from '@tanstack/react-query';
import { ReportsApi } from '@/src/api/reports.api';
import { usePreferredCurrency } from '@/src/hooks/useReportingCurrency';

export function useInsights(asOf: string) {
  const preferredCurrency = usePreferredCurrency();
  return useQuery({
    queryKey: ['insights', asOf, preferredCurrency],
    queryFn: () => ReportsApi.insights(asOf),
    enabled: Boolean(asOf),
  });
}
