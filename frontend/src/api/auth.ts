import { api, unwrap } from './axios';
import { LoginResult } from '@/types';

export const login = (email: string, password: string) =>
  api.post('/auth/login', { email, password }).then(unwrap<LoginResult>);
