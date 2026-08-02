import {
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';

import AccountsApi, {
  CreateAccountRequest,
} from '../api/accounts.api';

export function useCreateAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateAccountRequest) =>
      AccountsApi.createAccount(payload),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['accounts'],
      });
    },
  });
}