import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getVeiculos, createVeiculo, updateVeiculo, deleteVeiculo } from '../api/veiculos';
import type { Veiculo, PagedResult, StatusVeiculo } from '../types';
import Modal from '../components/Modal';
import Pagination from '../components/Pagination';
import StatusBadge from '../components/StatusBadge';
import MaskedInput, { Masks } from '../components/MaskedInput';
import { useForm } from 'react-hook-form';

interface FormData {
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

const inputCls =
  'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition';

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {children}
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  );
}

export default function Veiculos() {
  const { isAdmin } = useAuth();
  const [result, setResult] = useState<PagedResult<Veiculo> | null>(null);
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState<'create' | 'edit' | null>(null);
  const [editing, setEditing] = useState<Veiculo | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Veiculo | null>(null);
  const [error, setError] = useState('');

  const { register, handleSubmit, reset, control, formState: { errors, isSubmitting } } = useForm<FormData>();

  async function load() {
    setResult(await getVeiculos(page));
  }

  useEffect(() => { load(); }, [page]);

  function openCreate() {
    reset({ placa: '', marca: '', modelo: '', anoFab: new Date().getFullYear(), anoMod: new Date().getFullYear(), chassi: '', renavam: '', cor: '', status: 'Ativo' });
    setEditing(null);
    setModal('create');
    setError('');
  }

  function openEdit(v: Veiculo) {
    reset({ placa: v.placa, marca: v.marca, modelo: v.modelo, anoFab: v.anoFab, anoMod: v.anoMod, chassi: v.chassi, renavam: v.renavam, cor: v.cor, status: v.status });
    setEditing(v);
    setModal('edit');
    setError('');
  }

  async function onSubmit(data: FormData) {
    setError('');
    try {
      const payload = { ...data, anoFab: Number(data.anoFab), anoMod: Number(data.anoMod) };
      if (modal === 'create') await createVeiculo(payload);
      else if (editing) await updateVeiculo(editing.id_veiculo, payload);
      setModal(null);
      load();
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setError(msg ?? 'Erro ao salvar.');
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    await deleteVeiculo(deleteTarget.id_veiculo);
    setDeleteTarget(null);
    load();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-900">Veículos</h1>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
        >
          <Plus size={16} /> Novo Veículo
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Placa</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Marca / Modelo</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Ano</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Cor</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {result?.items.map((v) => (
              <tr key={v.id_veiculo} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="px-4 py-3 font-mono font-medium text-gray-900">{v.placa}</td>
                <td className="px-4 py-3 text-gray-700">{v.marca} {v.modelo}</td>
                <td className="px-4 py-3 text-gray-600">{v.anoFab}/{v.anoMod}</td>
                <td className="px-4 py-3 text-gray-600">{v.cor}</td>
                <td className="px-4 py-3"><StatusBadge status={v.status} /></td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2">
                    {isAdmin && <button onClick={() => openEdit(v)} className="text-gray-400 hover:text-blue-600 transition"><Pencil size={15} /></button>}
                    <button onClick={() => setDeleteTarget(v)} className="text-gray-400 hover:text-red-600 transition"><Trash2 size={15} /></button>
                  </div>
                </td>
              </tr>
            ))}
            {result?.items.length === 0 && (
              <tr><td colSpan={6} className="text-center py-8 text-gray-400">Nenhum veículo encontrado.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {result && <Pagination page={page} totalPages={result.totalPages} onPageChange={setPage} />}

      {(modal === 'create' || modal === 'edit') && (
        <Modal title={modal === 'create' ? 'Novo Veículo' : 'Editar Veículo'} onClose={() => setModal(null)}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Placa" error={errors.placa?.message}>
                <input
                  {...register('placa', {
                    required: 'Obrigatório',
                    setValueAs: (v: string) => v.toUpperCase().replace(/-/g, ''),
                    pattern: {
                      value: /^[A-Z]{3}[0-9]{4}$|^[A-Z]{3}[0-9][A-Z][0-9]{2}$/,
                      message: 'Formato inválido (ex: ABC1234 ou ABC1D23)',
                    },
                  })}
                  className={inputCls}
                  placeholder="ABC1234 ou ABC1D23"
                  maxLength={7}
                  onInput={(e) => { (e.target as HTMLInputElement).value = (e.target as HTMLInputElement).value.toUpperCase().replace(/-/g, ''); }}
                />
              </Field>
              <Field label="Status" error={errors.status?.message}>
                <select {...register('status', { required: 'Obrigatório' })} className={inputCls}>
                  <option value="Ativo">Ativo</option>
                  <option value="Inativo">Inativo</option>
                  <option value="Bloqueado">Bloqueado</option>
                </select>
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Marca" error={errors.marca?.message}>
                <input {...register('marca', { required: 'Obrigatório' })} className={inputCls} />
              </Field>
              <Field label="Modelo" error={errors.modelo?.message}>
                <input {...register('modelo', { required: 'Obrigatório' })} className={inputCls} />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Ano Fabricação" error={errors.anoFab?.message}>
                <input type="number" {...register('anoFab', { required: 'Obrigatório' })} className={inputCls} />
              </Field>
              <Field label="Ano Modelo" error={errors.anoMod?.message}>
                <input type="number" {...register('anoMod', { required: 'Obrigatório' })} className={inputCls} />
              </Field>
            </div>
            <Field label="Chassi" error={errors.chassi?.message}>
              <input
                {...register('chassi', { required: 'Obrigatório', setValueAs: (v: string) => v.toUpperCase() })}
                className={inputCls}
                placeholder="9BWZZZ377VT004251"
                maxLength={17}
                onInput={(e) => { (e.target as HTMLInputElement).value = (e.target as HTMLInputElement).value.toUpperCase(); }}
              />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="RENAVAM" error={errors.renavam?.message}>
                <MaskedInput control={control} name="renavam" mask={Masks.renavam} rules={{ required: 'Obrigatório' }} placeholder="00000000000" />
              </Field>
              <Field label="Cor" error={errors.cor?.message}>
                <input {...register('cor', { required: 'Obrigatório' })} className={inputCls} />
              </Field>
            </div>
            {error && <p className="text-sm text-red-600 bg-red-50 rounded px-3 py-2">{error}</p>}
            <div className="flex gap-2 justify-end pt-2">
              <button type="button" onClick={() => setModal(null)} className="px-4 py-2 text-sm rounded-lg border border-gray-300 hover:bg-gray-50">Cancelar</button>
              <button type="submit" disabled={isSubmitting} className="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60">Salvar</button>
            </div>
          </form>
        </Modal>
      )}

      {deleteTarget && (
        <Modal title="Confirmar exclusão" onClose={() => setDeleteTarget(null)}>
          <p className="text-gray-600 mb-6">Deseja excluir o veículo <strong>{deleteTarget.placa}</strong>?</p>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setDeleteTarget(null)} className="px-4 py-2 text-sm rounded-lg border border-gray-300 hover:bg-gray-50">Cancelar</button>
            <button onClick={confirmDelete} className="px-4 py-2 text-sm rounded-lg bg-red-600 text-white hover:bg-red-700">Excluir</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
