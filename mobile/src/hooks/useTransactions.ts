import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import TransactionsService from '@/src/services/transactions.service';

import {
  CreateTransactionRequest,
  UpdateTransactionRequest,
} from '@/src/api/transactions.api';

const QUERY_KEY = ['transactions'];

export function useTransactions() {
  const queryClient = useQueryClient();

  const transactionsQuery = useQuery({
    queryKey: QUERY_KEY,

    queryFn: () =>
      TransactionsService.getAll(),
  });

  const createMutation = useMutation({
    mutationFn: (
      payload: CreateTransactionRequest,
    ) =>
      TransactionsService.create(
        payload,
      ),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEY,
      });

      // Accounts change because balances change
      queryClient.invalidateQueries({
        queryKey: ['accounts'],
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;

      payload: UpdateTransactionRequest;
    }) =>
      TransactionsService.update(
        id,
        payload,
      ),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEY,
      });

      queryClient.invalidateQueries({
        queryKey: ['accounts'],
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      TransactionsService.remove(id),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEY,
      });

      queryClient.invalidateQueries({
        queryKey: ['accounts'],
      });
    },
  });

  return {
    transactions:
      transactionsQuery.data ?? [],

    isLoading:
      transactionsQuery.isLoading,

    isFetching:
      transactionsQuery.isFetching,

    error:
      transactionsQuery.error,

    refetch:
      transactionsQuery.refetch,

    createTransaction:
      createMutation.mutateAsync,

    updateTransaction:
      updateMutation.mutateAsync,

    deleteTransaction:
      deleteMutation.mutateAsync,

    creating:
      createMutation.isPending,

    updating:
      updateMutation.isPending,

    deleting:
      deleteMutation.isPending,
  };
}