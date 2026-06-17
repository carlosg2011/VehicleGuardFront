import api from './axios';
import type { Usuario, PagedResult } from '../types';

export const getUsuarios = (page = 1, pageSize = 10) =>
  api.get<PagedResult<Usuario>>('/usuarios', { params: { page, pageSize } }).then((r) => r.data);

export const getUsuario = (id: number) =>
  api.get<Usuario>(`/usuarios/${id}`).then((r) => r.data);

export const createUsuario = (data: {
  nome: string;
  email: string;
  senha: string;
  role: string;
}) => api.post<Usuario>('/usuarios', data).then((r) => r.data);

export const updateUsuario = (
  id: number,
  data: { nome: string; email: string; senha?: string; role: string }
) => api.put<Usuario>(`/usuarios/${id}`, data).then((r) => r.data);

export const deleteUsuario = (id: number) => api.delete(`/usuarios/${id}`);
