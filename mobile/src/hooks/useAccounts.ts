import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

import AccountsService from '@/src/services/accounts.service';

import {
  Account,
  CreateAccountRequest,
  UpdateAccountRequest,
} from '@/src/api/accounts.api';

const ACCOUNTS_QUERY_KEY = ['accounts'];

export function useAccounts() {
  const queryClient = useQueryClient();

  /**
   * Fetch accounts
   */
  const {
    data: accounts = [],
    isLoading,
    isRefetching,
    error,
    refetch,
  } = useQuery<Account[]>({
    queryKey: ACCOUNTS_QUERY_KEY,
    queryFn: () => AccountsService.getAccounts(),
  });

  /**
   * Create account
   */
  const createMutation = useMutation({
    mutationFn: (payload: CreateAccountRequest) =>
      AccountsService.createAccount(payload),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ACCOUNTS_QUERY_KEY,
      });
    },
  });

  /**
   * Update account
   */
  const updateMutation = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: UpdateAccountRequest;
    }) =>
      AccountsService.updateAccount(
        id,
        payload,
      ),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ACCOUNTS_QUERY_KEY,
      });
    },
  });

  /**
   * Archive account
   */
  const archiveMutation = useMutation({
    mutationFn: (id: string) =>
      AccountsService.archiveAccount(id),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ACCOUNTS_QUERY_KEY,
      });
    },
  });

  return {
    accounts,

    loading: isLoading,

    refreshing: isRefetching,

    error,

    refetch,

    createAccount:
      createMutation.mutateAsync,

    updateAccount:
      updateMutation.mutateAsync,

    archiveAccount:
      archiveMutation.mutateAsync,

    creating:
      createMutation.isPending,

    updating:
      updateMutation.isPending,

    archiving:
      archiveMutation.isPending,
  };
}