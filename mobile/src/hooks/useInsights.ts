import { useQuery } from '@tanstack/react-query';
import { ReportsApi } from '@/src/api/reports.api';

export function useInsights(asOf: string) {
  return useQuery({
    queryKey: ['insights', asOf],
    queryFn: () => ReportsApi.insights(asOf),
    enabled: Boolean(asOf),
  });
}
