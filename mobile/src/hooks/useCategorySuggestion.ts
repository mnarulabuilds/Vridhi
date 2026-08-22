import { useQuery } from '@tanstack/react-query';
import TransactionsApi, { TransactionType } from '@/src/api/transactions.api';

export function useCategorySuggestion(query: string, type?: TransactionType) {
  const q = query.trim();
  return useQuery({
    queryKey: ['category-suggestion', q, type],
    queryFn: async () => {
      const { data } = await TransactionsApi.suggestCategory({ q, type });
      return data;
    },
    enabled: q.length >= 2 && (type === 'INCOME' || type === 'EXPENSE'),
    staleTime: 30_000,
  });
}
