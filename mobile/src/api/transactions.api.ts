import { api } from './client';

export type TransactionType = 'INCOME' | 'EXPENSE' | 'TRANSFER';

export interface Transaction {
  id: string;
  title: string;
  amount: number;
  type: TransactionType;
  categoryId?: string | null;
  category?: { id: string; name: string } | string | null;
  merchant?: string | null;
  notes?: string | null;
  transactionDate: string;
  accountId: string;
  transferToAccountId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTransactionRequest {
  title: string;
  amount: number;
  type: TransactionType;
  categoryId?: string;
  transferToAccountId?: string;
  merchant?: string;
  notes?: string;
  transactionDate: string;
  accountId: string;
}

export type UpdateTransactionRequest = Partial<CreateTransactionRequest>;

export interface TransactionListQuery {
  from?: string;
  to?: string;
  accountId?: string;
  categoryId?: string;
  type?: TransactionType;
  search?: string;
  cursor?: string;
  limit?: number;
}

export interface TransactionListResponse {
  items: Transaction[];
  nextCursor: string | null;
}

export function categoryLabel(transaction: Transaction) {
  if (typeof transaction.category === 'string' && transaction.category) {
    return transaction.category;
  }
  if (transaction.category && typeof transaction.category === 'object') {
    return transaction.category.name;
  }
  return transaction.type === 'TRANSFER' ? 'Transfer' : 'Uncategorized';
}

const TransactionsApi = {
  getAll(params?: TransactionListQuery) {
    return api.get<TransactionListResponse>('/transactions', { params });
  },
  getById(id: string) {
    return api.get<Transaction>(`/transactions/${id}`);
  },
  create(payload: CreateTransactionRequest) {
    return api.post<Transaction>('/transactions', payload);
  },
  update(id: string, payload: UpdateTransactionRequest) {
    return api.patch<Transaction>(`/transactions/${id}`, payload);
  },
  remove(id: string) {
    return api.delete(`/transactions/${id}`);
  },
  suggestCategory(params: { q: string; type?: TransactionType }) {
    return api.get<{ categoryId: string; categoryName: string } | null>('/transactions/category-suggestion', {
      params,
    });
  },
};

export default TransactionsApi;
