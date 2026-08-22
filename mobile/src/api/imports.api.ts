import { api } from './client';

export interface ColumnMapping {
  date: string;
  amount?: string;
  debit?: string;
  credit?: string;
  title?: string;
  description?: string;
  merchant?: string;
  type?: string;
}

export const ImportsApi = {
  commit: async (payload: {
    accountId: string;
    mapping: ColumnMapping;
    header: string[];
    rows: string[][];
  }) =>
    (await api.post<{ created: number; skipped: number; errors: Array<{ row: number; message: string }> }>(
      '/imports/commit',
      payload,
    )).data,
};

export const AiApi = {
  chat: async (payload: {
    conversationId?: string;
    messages: Array<{ role: 'user' | 'assistant'; content: string }>;
  }) =>
    (
      await api.post<{
        conversationId: string;
        message: { role: 'assistant'; content: string };
        disclaimer: string;
      }>('/ai/chat', payload)
    ).data,
};
