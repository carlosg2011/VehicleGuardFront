import api from './axios';
import type { TokenResponse } from '../types';

export const login = (email: string, senha: string) =>
  api.post<TokenResponse>('/auth/login', { email, senha }).then((r) => r.data);

export const forgotPassword = (email: string) =>
  api.post('/auth/forgot-password', { email });

export const validateToken = (token: string) =>
  api.post('/auth/validate-token', { token });

export const resetPassword = (token: string, novaSenha: string) =>
  api.post('/auth/reset-password', { token, novaSenha });
