import type { QueryClient } from '@tanstack/react-query';

export function invalidateReportingQueries(client: QueryClient) {
  return Promise.all([
    client.invalidateQueries({ queryKey: ['net-worth'] }),
    client.invalidateQueries({ queryKey: ['financial-summary'] }),
    client.invalidateQueries({ queryKey: ['insights'] }),
  ]);
}
