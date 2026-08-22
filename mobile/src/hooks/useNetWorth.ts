import { useQuery } from '@tanstack/react-query';
import { ReportsApi } from '@/src/api/reports.api';

export function useNetWorth(asOf: string) {
  return useQuery({
    queryKey: ['net-worth', asOf],
    queryFn: () => ReportsApi.netWorth(asOf),
    enabled: Boolean(asOf),
  });
}
