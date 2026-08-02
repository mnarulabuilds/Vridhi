import axios from 'axios';
import TokenStorage from '../storage/token.storage';

export const api = axios.create({
  baseURL: 'http://localhost:3001/api/v1', // Replace with your machine's IP
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