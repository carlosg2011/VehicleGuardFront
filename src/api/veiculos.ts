import api from './axios';
import type { Veiculo, PagedResult, StatusVeiculo } from '../types';

export const getVeiculos = (page = 1, pageSize = 10) =>
  api.get<PagedResult<Veiculo>>('/veiculos', { params: { page, pageSize } }).then((r) => r.data);

export const getVeiculo = (id: number) =>
  api.get<Veiculo>(`/veiculos/${id}`).then((r) => r.data);

export const createVeiculo = (data: {
  placa: string;
  marca: string;
  modelo: string;
  anoFab: number;
  anoMod: number;
  chassi: string;
  renavam: string;
  cor: string;
  status: StatusVeiculo;
}) => api.post<Veiculo>('/veiculos', data).then((r) => r.data);

export const updateVeiculo = (
  id: number,
  data: {
    placa: string;
    marca: string;
    modelo: string;
    anoFab: number;
    anoMod: number;
    chassi: string;
    renavam: string;
    cor: string;
    status: StatusVeiculo;
  }
) => api.put<Veiculo>(`/veiculos/${id}`, data).then((r) => r.data);

export const deleteVeiculo = (id: number) => api.delete(`/veiculos/${id}`);
