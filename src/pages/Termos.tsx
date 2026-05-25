import { useEffect, useState } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import { getTermos, updateTermo, deleteTermo } from '../api/termos';
import type { Termo, PagedResult, StatusTermo } from '../types';
import Modal from '../components/Modal';
import Pagination from '../components/Pagination';
import StatusBadge from '../components/StatusBadge';
import { useForm } from 'react-hook-form';
import { useAuth } from '../contexts/AuthContext';

interface FormData {
  numeroTermo: string;
  status: StatusTermo;
  dataEnvio: string;
  dataAssinatura: string;
  id_proposta: number;
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

export default function Termos() {
  const [result, setResult] = useState<PagedResult<Termo> | null>(null);
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState<'edit' | null>(null);
  const [editing, setEditing] = useState<Termo | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Termo | null>(null);
  const [error, setError] = useState('');

  const { user, isAdmin } = useAuth();
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>();

  async function load() {
    setResult(await getTermos(page, 10, isAdmin ? undefined : user?.id));
  }

  useEffect(() => { load(); }, [page]);

  function openEdit(t: Termo) {
    reset({ numeroTermo: t.numeroTermo, status: t.status, dataEnvio: t.dataEnvio.slice(0, 10), dataAssinatura: t.dataAssinatura ? t.dataAssinatura.slice(0, 10) : '', id_proposta: t.id_proposta });
    setEditing(t);
    setModal('edit');
    setError('');
  }

  async function onSubmit(data: FormData) {
    if (!editing) return;
    setError('');
    try {
      const payload = {
        ...data,
        dataEnvio: new Date(data.dataEnvio).toISOString(),
        dataAssinatura: data.dataAssinatura ? new Date(data.dataAssinatura).toISOString() : null,
        id_proposta: Number(data.id_proposta),
      };
      await updateTermo(editing.id_termo, payload);
      setModal(null);
      load();
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setError(msg ?? 'Erro ao salvar.');
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    await deleteTermo(deleteTarget.id_termo);
    setDeleteTarget(null);
    load();
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Termos</h1>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Número</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Envio</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Assinatura</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Proposta</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {result?.items.map((t) => (
              <tr key={t.id_termo} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="px-4 py-3 font-mono font-medium text-gray-900">{t.numeroTermo}</td>
                <td className="px-4 py-3"><StatusBadge status={t.status} /></td>
                <td className="px-4 py-3 text-gray-600">{new Date(t.dataEnvio).toLocaleDateString('pt-BR')}</td>
                <td className="px-4 py-3 text-gray-600">{t.dataAssinatura ? new Date(t.dataAssinatura).toLocaleDateString('pt-BR') : '—'}</td>
                <td className="px-4 py-3 text-gray-600">#{t.id_proposta}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2">
                    <button onClick={() => openEdit(t)} className="text-gray-400 hover:text-blue-600 transition"><Pencil size={15} /></button>
                    <button onClick={() => setDeleteTarget(t)} className="text-gray-400 hover:text-red-600 transition"><Trash2 size={15} /></button>
                  </div>
                </td>
              </tr>
            ))}
            {result?.items.length === 0 && (
              <tr><td colSpan={6} className="text-center py-8 text-gray-400">Nenhum termo encontrado.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {result && <Pagination page={page} totalPages={result.totalPages} onPageChange={setPage} />}

      {modal === 'edit' && editing && (
        <Modal title="Editar Termo" onClose={() => setModal(null)}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Field label="Número do Termo" error={errors.numeroTermo?.message}>
              <input {...register('numeroTermo', { required: 'Obrigatório', maxLength: { value: 25, message: 'Máx 25 caracteres' } })} className={inputCls} />
            </Field>
            <Field label="Status" error={errors.status?.message}>
              <select {...register('status', { required: 'Obrigatório' })} className={inputCls}>
                <option value="Ativo">Ativo</option>
                <option value="Expirado">Expirado</option>
                <option value="Cancelado">Cancelado</option>
              </select>
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Data de Envio" error={errors.dataEnvio?.message}>
                <input type="date" {...register('dataEnvio', { required: 'Obrigatório' })} className={inputCls} />
              </Field>
              <Field label="Data de Assinatura (opcional)">
                <input type="date" {...register('dataAssinatura')} className={inputCls} />
              </Field>
            </div>
            <Field label="ID Proposta" error={errors.id_proposta?.message}>
              <input type="number" {...register('id_proposta', { required: 'Obrigatório', min: { value: 1, message: 'Inválido' } })} className={inputCls} />
            </Field>
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
          <p className="text-gray-600 mb-6">Deseja excluir o termo <strong>{deleteTarget.numeroTermo}</strong>?</p>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setDeleteTarget(null)} className="px-4 py-2 text-sm rounded-lg border border-gray-300 hover:bg-gray-50">Cancelar</button>
            <button onClick={confirmDelete} className="px-4 py-2 text-sm rounded-lg bg-red-600 text-white hover:bg-red-700">Excluir</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
