import { useQuery } from '@tanstack/react-query';

import TransactionsService from '@/src/services/transactions.service';

export function useTransaction(
    id: string,
) {
    return useQuery({
        queryKey: [
            'transaction',
            id,
        ],

        queryFn: () =>
            TransactionsService.getById(id),

        enabled: !!id,
    });
}