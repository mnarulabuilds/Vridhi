import { api } from "./client";

export interface Transaction {
  id: string;

  title: string;

  amount: number;

  type: 'INCOME' | 'EXPENSE' | 'TRANSFER';

  category: string;

  merchant?: string;

  notes?: string;

  transactionDate: string;

  accountId: string;

  createdAt: string;

  updatedAt: string;
}

export interface CreateTransactionRequest {
  title: string;

  amount: number;

  type: 'INCOME' | 'EXPENSE' | 'TRANSFER';

  category: string;

  merchant?: string;

  notes?: string;

  transactionDate: string;

  accountId: string;
}

export type UpdateTransactionRequest =
  Partial<CreateTransactionRequest>;

const TransactionsApi = {
  getAll() {
    return api.get<Transaction[]>(
      '/transactions',
    );
  },

  getById(id: string) {
    return api.get<Transaction>(
      `/transactions/${id}`,
    );
  },

  create(
    payload: CreateTransactionRequest,
  ) {
    return api.post<Transaction>(
      '/transactions',
      payload,
    );
  },

  update(
    id: string,
    payload: UpdateTransactionRequest,
  ) {
    return api.patch<Transaction>(
      `/transactions/${id}`,
      payload,
    );
  },

  remove(id: string) {
    return api.delete(
      `/transactions/${id}`,
    );
  },
};

export default TransactionsApi;