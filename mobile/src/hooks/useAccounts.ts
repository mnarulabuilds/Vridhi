import { useQuery } from '@tanstack/react-query';

import AccountsApi from '../api/accounts.api';

export function useAccounts() {
  return useQuery({
    queryKey: ['accounts'],
    queryFn: () => AccountsApi.getAccounts(),
  });
}