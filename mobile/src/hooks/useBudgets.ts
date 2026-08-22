import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { BudgetsApi, type UpsertBudgetRequest } from '@/src/api/budgets.api';

export function useBudgets(periodStart: string) {
  const client = useQueryClient();
  const key = ['budgets', periodStart];
  const query = useQuery({ queryKey: key, queryFn: () => BudgetsApi.list(periodStart), enabled: Boolean(periodStart) });
  const upsert = useMutation({
    mutationFn: (payload: UpsertBudgetRequest) => BudgetsApi.upsert(payload),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: key });
      client.invalidateQueries({ queryKey: ['financial-summary'] });
    },
  });
  return { budgets: query.data ?? [], ...query, upsertBudget: upsert.mutateAsync, saving: upsert.isPending };
}
