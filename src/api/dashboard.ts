import api from './axios';

export interface DashboardSummary {
  veiculos: number;
  propostas: number;
  vistorias: number;
  termosAssinados: number;
  termosPendentes: number;
}

export const getDashboard = (userId?: number) =>
  api
    .get<DashboardSummary>('/dashboard', { params: userId ? { userId } : {} })
    .then((r) => r.data);
