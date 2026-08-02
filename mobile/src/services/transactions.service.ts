import TransactionsApi, {
  CreateTransactionRequest,
  UpdateTransactionRequest,
} from '@/src/api/transactions.api';

class TransactionsService {
  async getAll() {
    const { data } =
      await TransactionsApi.getAll();

    return data;
  }

  async getById(id: string) {
    const { data } =
      await TransactionsApi.getById(id);

    return data;
  }

  async create(
    payload: CreateTransactionRequest,
  ) {
    const { data } =
      await TransactionsApi.create(
        payload,
      );

    return data;
  }

  async update(
    id: string,
    payload: UpdateTransactionRequest,
  ) {
    const { data } =
      await TransactionsApi.update(
        id,
        payload,
      );

    return data;
  }

  async remove(id: string) {
    await TransactionsApi.remove(id);
  }
}

export default new TransactionsService();