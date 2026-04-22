import { api } from './axios';
import { AuthUser } from '../types';

export const getAgents = async (): Promise<AuthUser[]> => {
  const { data } = await api.get('/users/agents');
  return data.data;
};
