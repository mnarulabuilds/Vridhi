import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import TransactionsService from '@/src/services/transactions.service';
import {
  CreateTransactionRequest,
  TransactionListQuery,
  UpdateTransactionRequest,
} from '@/src/api/transactions.api';

export function useTransactions(query?: TransactionListQuery) {
  const queryClient = useQueryClient();
  const transactionsQuery = useQuery({
    queryKey: ['transactions', query],
    queryFn: () => TransactionsService.getAll(query),
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['transactions'] });
    queryClient.invalidateQueries({ queryKey: ['accounts'] });
    queryClient.invalidateQueries({ queryKey: ['financial-summary'] });
    queryClient.invalidateQueries({ queryKey: ['insights'] });
  };

  const createMutation = useMutation({
    mutationFn: (payload: CreateTransactionRequest) => TransactionsService.create(payload),
    onSuccess: invalidate,
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateTransactionRequest }) =>
      TransactionsService.update(id, payload),
    onSuccess: invalidate,
  });
  const deleteMutation = useMutation({
    mutationFn: (id: string) => TransactionsService.remove(id),
    onSuccess: invalidate,
  });

  return {
    transactions: transactionsQuery.data?.items ?? [],
    nextCursor: transactionsQuery.data?.nextCursor ?? null,
    isLoading: transactionsQuery.isLoading,
    isFetching: transactionsQuery.isFetching,
    error: transactionsQuery.error,
    refetch: transactionsQuery.refetch,
    createTransaction: createMutation.mutateAsync,
    updateTransaction: updateMutation.mutateAsync,
    deleteTransaction: deleteMutation.mutateAsync,
    creating: createMutation.isPending,
    updating: updateMutation.isPending,
    deleting: deleteMutation.isPending,
  };
}
