import AccountsApi, {
  Account,
  CreateAccountRequest,
  UpdateAccountRequest,
} from '@/src/api/accounts.api';

class AccountsService {
  /**
   * Fetch all accounts
   */
  async getAccounts(): Promise<Account[]> {
    return AccountsApi.getAccounts();
  }

  /**
   * Create a new account
   */
  async createAccount(
    payload: CreateAccountRequest,
  ): Promise<Account> {
    return AccountsApi.createAccount(payload);
  }

  /**
   * Update an account
   */
  async updateAccount(
    id: string,
    payload: UpdateAccountRequest,
  ): Promise<Account> {
    return AccountsApi.updateAccount(
      id,
      payload,
    );
  }

  /**
   * Archive an account
   */
  async archiveAccount(
    id: string,
  ): Promise<Account> {
    return AccountsApi.archiveAccount(id);
  }

  /**
   * Fetch an account
   */

  async fetchAccount(id: string): Promise<Account> {
    return AccountsApi.fetchAccount(id);
  }
}

export default new AccountsService();