import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { getToken, removeToken } from '@/utils/token';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 10_000,
});

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getToken();
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      removeToken();
      // Trigger a page redirect without importing router (avoids circular deps)
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

/** Unwraps `{ success, data }` envelope returned by the backend. */
export const unwrap = <T>(response: { data: { data: T } }): T => response.data.data;
