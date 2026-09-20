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

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ACCOUNTS_QUERY_KEY });
    queryClient.invalidateQueries({ queryKey: ['net-worth'] });
    queryClient.invalidateQueries({ queryKey: ['financial-summary'] });
  };

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

    onSuccess: invalidate,
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

    onSuccess: (_data, { id }) => {
      invalidate();
      queryClient.invalidateQueries({ queryKey: ['account', id] });
    },
  });

  /**
   * Archive account
   */
  const archiveMutation = useMutation({
    mutationFn: (id: string) =>
      AccountsService.archiveAccount(id),

    onSuccess: (_data, id) => {
      invalidate();
      queryClient.removeQueries({ queryKey: ['account', id] });
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