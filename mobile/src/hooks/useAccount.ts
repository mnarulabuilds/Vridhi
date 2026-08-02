import {
    useQuery,
} from '@tanstack/react-query';

import AccountsService from '@/src/services/accounts.service';

import {
    Account,
} from '@/src/api/accounts.api';


export function useAccount(id: string) {
    const ACCOUNT_QUERY_KEY = ['account', id];

    /**
       * Fetch accounts
       */

    const {
        data: account = {},
        isLoading,
        isRefetching,
        error,
        refetch,
    } = useQuery<Account>({
        queryKey: ACCOUNT_QUERY_KEY,
        queryFn: () => AccountsService.fetchAccount(id),
    });

    return {
        account,

        loading: isLoading,

        refreshing: isRefetching,

        error,

        refetch,

    };
}