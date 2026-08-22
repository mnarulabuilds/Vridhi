import { keepPreviousData, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import TransactionsService from '@/src/services/transactions.service';
import {
  CreateTransactionRequest,
  TransactionListQuery,
  UpdateTransactionRequest,
} from '@/src/api/transactions.api';

export function useTransactions(query?: TransactionListQuery) {
  const queryClient = useQueryClient();
  const transactionsQuery = useInfiniteQuery({
    queryKey: ['transactions', query],
    queryFn: ({ pageParam }) =>
      TransactionsService.getAll({
        ...query,
        cursor: pageParam,
        limit: query?.limit ?? 50,
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    placeholderData: keepPreviousData,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['transactions'] });
    queryClient.invalidateQueries({ queryKey: ['accounts'] });
    queryClient.invalidateQueries({ queryKey: ['financial-summary'] });
    queryClient.invalidateQueries({ queryKey: ['insights'] });
    queryClient.invalidateQueries({ queryKey: ['net-worth'] });
    queryClient.invalidateQueries({ queryKey: ['category-suggestion'] });
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
    transactions: transactionsQuery.data?.pages.flatMap((page) => page.items) ?? [],
    nextCursor: transactionsQuery.data?.pages.at(-1)?.nextCursor ?? null,
    isLoading: transactionsQuery.isLoading,
    isFetching: transactionsQuery.isFetching,
    error: transactionsQuery.error,
    refetch: transactionsQuery.refetch,
    fetchNextPage: transactionsQuery.fetchNextPage,
    hasNextPage: Boolean(transactionsQuery.hasNextPage),
    isFetchingNextPage: transactionsQuery.isFetchingNextPage,
    createTransaction: createMutation.mutateAsync,
    updateTransaction: updateMutation.mutateAsync,
    deleteTransaction: deleteMutation.mutateAsync,
    creating: createMutation.isPending,
    updating: updateMutation.isPending,
    deleting: deleteMutation.isPending,
  };
}
