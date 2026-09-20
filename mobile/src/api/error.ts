import axios from 'axios';

function normalizeMessage(message: unknown): string | undefined {
  if (typeof message === 'string' && message.trim()) {
    return message;
  }
  if (Array.isArray(message)) {
    const parts = message.filter((part): part is string => typeof part === 'string' && part.trim());
    if (parts.length) {
      return parts.join('\n');
    }
  }
  return undefined;
}

export function getApiErrorMessage(
  error: unknown,
  fallback = 'Something went wrong.',
): string {
  if (axios.isAxiosError(error)) {
    return (
      normalizeMessage(error.response?.data?.message) ??
      error.message ??
      fallback
    );
  }

  return fallback;
}