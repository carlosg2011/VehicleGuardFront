import api from './axios';
import type { Proposta, PropostaCompleta, PagedResult, StatusProposta, StatusVeiculo } from '../types';

export const getPropostas = (page = 1, pageSize = 10, userId?: number) =>
  api.get<PagedResult<Proposta>>('/proposta', { params: { page, pageSize, ...(userId ? { userId } : {}) } }).then((r) => r.data);

export const getProposta = (id: number) =>
  api.get<Proposta>(`/proposta/${id}`).then((r) => r.data);

export const createProposta = (data: {
  sessaoProposta: string;
  status: StatusProposta;
  id_usuario: number;
  id_veiculo: number;
  id_proprietario: number;
}) => api.post<Proposta>('/proposta', data).then((r) => r.data);

export const updateProposta = (
  id: number,
  data: {
    sessaoProposta: string;
    status: StatusProposta;
    id_usuario: number;
    id_veiculo: number;
    id_proprietario: number;
  }
) => api.put<Proposta>(`/proposta/${id}`, data).then((r) => r.data);

export const deleteProposta = (id: number) => api.delete(`/proposta/${id}`);

export const buscarPropostas = (
  page = 1,
  pageSize = 10,
  filtro: {
    nome?: string;
    placa?: string;
    renavam?: string;
    chassi?: string;
    statusVeiculo?: StatusVeiculo | '';
    statusProposta?: StatusProposta | '';
  } = {}
) => {
  const params: Record<string, unknown> = { page, pageSize };
  if (filtro.nome) params.nome = filtro.nome;
  if (filtro.placa) params.placa = filtro.placa;
  if (filtro.renavam) params.renavam = filtro.renavam;
  if (filtro.chassi) params.chassi = filtro.chassi;
  if (filtro.statusVeiculo) params.statusVeiculo = filtro.statusVeiculo;
  if (filtro.statusProposta) params.statusProposta = filtro.statusProposta;
  return api.get<PagedResult<PropostaCompleta>>('/proposta/busca', { params }).then((r) => r.data);
};
