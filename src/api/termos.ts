import api from './axios';
import type { Termo, PagedResult, StatusTermo } from '../types';

export const getTermos = (page = 1, pageSize = 10, userId?: number) =>
  api.get<PagedResult<Termo>>('/termos', { params: { page, pageSize, ...(userId ? { userId } : {}) } }).then((r) => r.data);

export const getTermo = (id: number) =>
  api.get<Termo>(`/termos/${id}`).then((r) => r.data);

export const getTermoPorProposta = (idProposta: number) =>
  api.get<Termo>(`/termos/proposta/${idProposta}`).then((r) => r.data);

export const createTermo = (data: {
  numeroTermo: string;
  status: StatusTermo;
  dataEnvio: string;
  dataAssinatura?: string | null;
  id_proposta: number;
}) => api.post<Termo>('/termos', data).then((r) => r.data);

export const updateTermo = (
  id: number,
  data: {
    numeroTermo: string;
    status: StatusTermo;
    dataEnvio: string;
    dataAssinatura?: string | null;
    id_proposta: number;
  }
) => api.put<Termo>(`/termos/${id}`, data).then((r) => r.data);

export const deleteTermo = (id: number) => api.delete(`/termos/${id}`);
