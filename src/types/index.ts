export type StatusVeiculo = 'Ativo' | 'Inativo' | 'Bloqueado';
export type StatusProposta = 'Pendente' | 'EmAnalise' | 'Aprovada' | 'Recusada' | 'Cancelada';
export type StatusVistoria = 'NaoIniciada' | 'Pendente' | 'Concluida' | 'Aprovada' | 'Recusada' | 'Cancelada' | 'Expirada';
export type StatusTermo = 'Ativo' | 'Assinado' | 'Expirado' | 'Cancelado';

export interface Usuario {
  id_usuario: number;
  nome: string;
  email: string;
  role: string;
}

export interface Proprietario {
  id_proprietario: number;
  nome: string;
  cpf: string;
  telefone: string;
  email: string;
}

export interface Veiculo {
  id_veiculo: number;
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

export interface Proposta {
  id_proposta: number;
  sessaoProposta: string;
  dataCriacao: string;
  status: StatusProposta;
  id_usuario: number;
  id_veiculo: number;
  id_proprietario: number;
}

export interface VistoriaFoto {
  id_foto: number;
  slot: string;
  url: string;
  verdict: 'approved' | 'rejected' | null;
}

export interface Vistoria {
  id_vistoria: number;
  dataSolicitacao: string;
  dataInicio: string | null;
  dataConclusao: string | null;
  status: StatusVistoria;
  id_proposta: number;
  sessaoProposta: string;
  id_usuario: number;
  nomeProprietario: string;
  placa: string;
  observacoes: string | null;
  fotos: VistoriaFoto[];
}

export interface Termo {
  id_termo: number;
  numeroTermo: string;
  status: StatusTermo;
  dataEnvio: string;
  dataAssinatura: string | null;
  id_proposta: number;
}

export interface PropostaCompleta {
  id_proposta: number;
  sessaoProposta: string;
  dataCriacao: string;
  statusProposta: StatusProposta;
  id_usuario: number;
  nomeUsuario: string;
  id_proprietario: number;
  nomeProprietario: string;
  cpfProprietario: string;
  id_veiculo: number;
  placa: string;
  marca: string;
  modelo: string;
  chassi: string;
  renavam: string;
  statusVeiculo: StatusVeiculo;
}

export interface PagedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

export interface TokenResponse {
  token: string;
  expiracao: string;
}

export interface AuthUser {
  id: number;
  nome: string;
  email: string;
  role: string;
}
