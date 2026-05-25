import api from './axios';
import type { Vistoria, PagedResult, StatusVistoria } from '../types';

export const getVistorias = (page = 1, pageSize = 10, userId?: number, propostaId?: number, excludeCancelled = false) =>
  api
    .get<PagedResult<Vistoria>>('/vistoria', {
      params: {
        page,
        pageSize,
        ...(userId ? { userId } : {}),
        ...(propostaId ? { propostaId } : {}),
        ...(excludeCancelled ? { excludeCancelled: true } : {}),
      },
    })
    .then((r) => r.data);

export const getVistoria = (id: number) =>
  api.get<Vistoria>(`/vistoria/${id}`).then((r) => r.data);

export const createVistoria = (data: {
  dataSolicitacao: string;
  status: StatusVistoria;
  id_proposta: number;
  id_usuario: number;
}) => api.post<Vistoria>('/vistoria', data).then((r) => r.data);

export const updateVistoria = (
  id: number,
  data: {
    status: StatusVistoria;
    dataInicio?: string | null;
    dataConclusao?: string | null;
  }
) => api.put<Vistoria>(`/vistoria/${id}`, data).then((r) => r.data);

export const deleteVistoria = (id: number) => api.delete(`/vistoria/${id}`);
