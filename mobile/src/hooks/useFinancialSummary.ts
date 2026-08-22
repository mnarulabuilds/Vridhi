import { useQuery } from '@tanstack/react-query';
import { ReportsApi } from '@/src/api/reports.api';
export function useFinancialSummary(from: string, to: string) {
  return useQuery({ queryKey: ['financial-summary', from, to], queryFn: () => ReportsApi.summary(from, to), enabled: Boolean(from && to) });
}
