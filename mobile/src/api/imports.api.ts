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
  listConversations: async () =>
    (
      await api.get<
        Array<{
          id: string;
          title: string | null;
          updatedAt: string;
          messages: Array<{ role: 'USER' | 'ASSISTANT'; content: string }>;
        }>
      >('/ai/conversations')
    ).data,
  getConversation: async (id: string) =>
    (
      await api.get<{
        id: string;
        messages: Array<{ role: 'USER' | 'ASSISTANT'; content: string }>;
      }>(`/ai/conversations/${id}`)
    ).data,
  chat: async (payload: {
    conversationId?: string;
    messages: Array<{ role: 'user' | 'assistant'; content: string }>;
  }) =>
    (
      await api.post<{
        conversationId: string;
        message: { role: 'assistant'; content: string };
        sources?: string[];
        mode?: 'template' | 'llm' | 'fallback';
        disclaimer: string;
      }>('/ai/chat', payload, { timeout: 90_000 })
    ).data,
};
