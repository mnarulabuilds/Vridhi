import axios from 'axios';
import TokenStorage from '../storage/token.storage';

export const api = axios.create({
  baseURL: `${process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3001'}/api/v1`,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(async (config) => {
  const token = await TokenStorage.getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let refreshPromise: Promise<string | null> | null = null;

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config as { _retry?: boolean; url?: string; headers: Record<string, string> };
    const status = error.response?.status;
    const url = original?.url ?? '';

    if (status !== 401 || original?._retry || url.includes('/auth/refresh') || url.includes('/auth/login')) {
      return Promise.reject(error);
    }

    original._retry = true;

    if (!refreshPromise) {
      refreshPromise = (async () => {
        const refreshToken = await TokenStorage.getRefreshToken();
        if (!refreshToken) {
          return null;
        }
        try {
          const { data } = await axios.post(
            `${process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3001'}/api/v1/auth/refresh`,
            { refreshToken },
          );
          await TokenStorage.saveTokens(data.accessToken, data.refreshToken);
          return data.accessToken as string;
        } catch {
          await TokenStorage.clear();
          return null;
        } finally {
          refreshPromise = null;
        }
      })();
    }

    const accessToken = await refreshPromise;
    if (!accessToken) {
      return Promise.reject(error);
    }
    original.headers.Authorization = `Bearer ${accessToken}`;
    return api(original);
  },
);
