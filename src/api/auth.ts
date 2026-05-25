import api from './axios';
import type { TokenResponse } from '../types';

export const login = (email: string, senha: string) =>
  api.post<TokenResponse>('/auth/login', { email, senha }).then((r) => r.data);
