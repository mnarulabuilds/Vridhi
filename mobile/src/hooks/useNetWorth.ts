import { useQuery } from '@tanstack/react-query';
import { ReportsApi } from '@/src/api/reports.api';
import { usePreferredCurrency } from '@/src/hooks/useReportingCurrency';

export function useNetWorth(asOf: string) {
  const preferredCurrency = usePreferredCurrency();
  return useQuery({
    queryKey: ['net-worth', asOf, preferredCurrency],
    queryFn: () => ReportsApi.netWorth(asOf),
    enabled: Boolean(asOf),
  });
}
