import axios from 'axios';
import TokenStorage from '../storage/token.storage';

export const api = axios.create({
  baseURL: `${process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3001'}/api/v1`,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(async config => {
  const token = await TokenStorage.getAccessToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});
