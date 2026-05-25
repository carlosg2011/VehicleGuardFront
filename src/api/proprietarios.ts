import api from './axios';
import type { Proprietario, PagedResult } from '../types';

export const getProprietarios = (page = 1, pageSize = 10) =>
  api
    .get<PagedResult<Proprietario>>('/proprietario', { params: { page, pageSize } })
    .then((r) => r.data);

export const getProprietario = (id: number) =>
  api.get<Proprietario>(`/proprietario/${id}`).then((r) => r.data);

export const createProprietario = (data: {
  nome: string;
  cpf: string;
  telefone: string;
  email: string;
}) => api.post<Proprietario>('/proprietario', data).then((r) => r.data);

export const updateProprietario = (
  id: number,
  data: { nome: string; cpf: string; telefone: string; email: string }
) => api.put<Proprietario>(`/proprietario/${id}`, data).then((r) => r.data);

export const deleteProprietario = (id: number) => api.delete(`/proprietario/${id}`);
