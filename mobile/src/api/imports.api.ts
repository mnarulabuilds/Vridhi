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
  previewJson: async (payload: { header: string[]; rows: string[][] }) =>
    (
      await api.post<{
        header: string[];
        suggestedMapping: ColumnMapping;
        rowCount: number;
        sample: string[][];
        rows: string[][];
      }>('/imports/preview-json', payload)
    ).data,
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
