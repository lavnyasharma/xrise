import { jwtDecode } from 'jwt-decode';
import { AuthUser } from '@/types';

const KEY = 'hd_token';

export const saveToken = (token: string): void => localStorage.setItem(KEY, token);

export const getToken = (): string | null => localStorage.getItem(KEY);

export const removeToken = (): void => localStorage.removeItem(KEY);

export const decodeUser = (token: string): AuthUser | null => {
  try {
    return jwtDecode<AuthUser>(token);
  } catch {
    return null;
  }
};
