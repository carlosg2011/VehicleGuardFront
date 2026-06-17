import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import {
  getProprietarios,
  createProprietario,
  updateProprietario,
  deleteProprietario,
} from '../api/proprietarios';
import type { Proprietario, PagedResult } from '../types';
import Modal from '../components/Modal';
import Pagination from '../components/Pagination';
import MaskedInput, { Masks } from '../components/MaskedInput';
import { useForm } from 'react-hook-form';

interface FormData {
  nome: string;
  cpf: string;
  telefone: string;
  email: string;
}

const inputCls =
  'w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 transition';

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {children}
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  );
}

export default function Proprietarios() {
  const [result, setResult] = useState<PagedResult<Proprietario> | null>(null);
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState<'create' | 'edit' | null>(null);
  const [editing, setEditing] = useState<Proprietario | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Proprietario | null>(null);
  const [error, setError] = useState('');

  const { register, handleSubmit, reset, control, formState: { errors, isSubmitting } } = useForm<FormData>();

  async function load() {
    setResult(await getProprietarios(page));
  }

  useEffect(() => { load(); }, [page]);

  function openCreate() {
    reset({ nome: '', cpf: '', telefone: '', email: '' });
    setEditing(null);
    setModal('create');
    setError('');
  }

  function openEdit(p: Proprietario) {
    reset({ nome: p.nome, cpf: p.cpf, telefone: p.telefone, email: p.email });
    setEditing(p);
    setModal('edit');
    setError('');
  }

  async function onSubmit(data: FormData) {
    setError('');
    try {
      if (modal === 'create') await createProprietario(data);
      else if (editing) await updateProprietario(editing.id_proprietario, data);
      setModal(null);
      load();
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setError(msg ?? 'Erro ao salvar.');
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    await deleteProprietario(deleteTarget.id_proprietario);
    setDeleteTarget(null);
    load();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Proprietários</h1>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
        >
          <Plus size={16} /> Novo Proprietário
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[560px]">
          <thead className="bg-gray-50 dark:bg-gray-800/80 border-b border-gray-100 dark:border-gray-700">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-300">Nome</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-300">CPF</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-300">Telefone</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-300">Email</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {result?.items.map((p) => (
              <tr key={p.id_proprietario} className="border-b border-gray-50 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{p.nome}</td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{p.cpf}</td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{p.telefone}</td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{p.email}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2">
                    <button onClick={() => openEdit(p)} className="text-gray-400 hover:text-blue-600 transition"><Pencil size={15} /></button>
                    <button onClick={() => setDeleteTarget(p)} className="text-gray-400 hover:text-red-600 transition"><Trash2 size={15} /></button>
                  </div>
                </td>
              </tr>
            ))}
            {result?.items.length === 0 && (
              <tr><td colSpan={5} className="text-center py-8 text-gray-400">Nenhum proprietário encontrado.</td></tr>
            )}
          </tbody>
        </table>
        </div>
      </div>

      {result && <Pagination page={page} totalPages={result.totalPages} onPageChange={setPage} />}

      {(modal === 'create' || modal === 'edit') && (
        <Modal title={modal === 'create' ? 'Novo Proprietário' : 'Editar Proprietário'} onClose={() => setModal(null)}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Field label="Nome" error={errors.nome?.message}>
              <input {...register('nome', { required: 'Obrigatório' })} className={inputCls} />
            </Field>
            <Field label="CPF / CNPJ" error={errors.cpf?.message}>
              <MaskedInput control={control} name="cpf" mask={Masks.cpfCnpj} rules={{ required: 'Obrigatório' }} placeholder="000.000.000-00" />
            </Field>
            <Field label="Telefone" error={errors.telefone?.message}>
              <MaskedInput control={control} name="telefone" mask={Masks.telefone} rules={{ required: 'Obrigatório' }} placeholder="(00) 00000-0000" />
            </Field>
            <Field label="Email" error={errors.email?.message}>
              <input type="email" {...register('email', { required: 'Obrigatório' })} className={inputCls} />
            </Field>
            {error && <p className="text-sm text-red-600 bg-red-50 rounded px-3 py-2">{error}</p>}
            <div className="flex gap-2 justify-end pt-2">
              <button type="button" onClick={() => setModal(null)} className="px-4 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-gray-200">Cancelar</button>
              <button type="submit" disabled={isSubmitting} className="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60">Salvar</button>
            </div>
          </form>
        </Modal>
      )}

      {deleteTarget && (
        <Modal title="Confirmar exclusão" onClose={() => setDeleteTarget(null)}>
          <p className="text-gray-600 dark:text-gray-300 mb-6">Deseja excluir o proprietário <strong>{deleteTarget.nome}</strong>?</p>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setDeleteTarget(null)} className="px-4 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-gray-200">Cancelar</button>
            <button onClick={confirmDelete} className="px-4 py-2 text-sm rounded-lg bg-red-600 text-white hover:bg-red-700">Excluir</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
