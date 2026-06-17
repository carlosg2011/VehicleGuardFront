const BASE = 'https://parallelum.com.br/fipe/api/v1';

export type FipeTipo = 'carros' | 'motos' | 'caminhoes';

export interface FipeMarca { codigo: string; nome: string; }
export interface FipeModelo { codigo: number; nome: string; }
export interface FipeAno { codigo: string; nome: string; }

async function fipeGet<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) throw new Error(`FIPE ${res.status}`);
  return res.json() as Promise<T>;
}

export const getMarcas = (tipo: FipeTipo) =>
  fipeGet<FipeMarca[]>(`/${tipo}/marcas`);

export const getModelos = (tipo: FipeTipo, codigoMarca: string) =>
  fipeGet<{ modelos: FipeModelo[]; anos: FipeAno[] }>(`/${tipo}/marcas/${codigoMarca}/modelos`);

export const getAnos = (tipo: FipeTipo, codigoMarca: string, codigoModelo: number) =>
  fipeGet<FipeAno[]>(`/${tipo}/marcas/${codigoMarca}/modelos/${codigoModelo}/anos`);
