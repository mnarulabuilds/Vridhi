import { api } from './client';

export type AccountType =
  | 'CASH'
  | 'SAVINGS'
  | 'CURRENT'
  | 'CREDIT_CARD'
  | 'WALLET'
  | 'INVESTMENT';

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  openingBalance: number;
  currency: string;
  icon?: string | null;
  color?: string | null;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAccountRequest {
  name: string;
  type: AccountType;
  openingBalance: number;
  currency: string;
  icon?: string;
  color?: string;
}

export interface UpdateAccountRequest {
  name?: string;
  type?: AccountType;
  openingBalance?: number;
  currency?: string;
  icon?: string;
  color?: string;
}

class AccountsApi {
  async getAccounts(): Promise<Account[]> {
    const response = await api.get<Account[]>('/accounts');
    return response.data;
  }

  async createAccount(
    payload: CreateAccountRequest,
  ): Promise<Account> {
    const response = await api.post<Account>(
      '/accounts',
      payload,
    );

    return response.data;
  }

  async updateAccount(
    id: string,
    payload: UpdateAccountRequest,
  ): Promise<Account> {
    const response = await api.patch<Account>(
      `/accounts/${id}`,
      payload,
    );

    return response.data;
  }

  async archiveAccount(
    id: string,
  ): Promise<Account> {
    const response = await api.delete<Account>(
      `/accounts/${id}`,
    );

    return response.data;
  }
}

export default new AccountsApi();