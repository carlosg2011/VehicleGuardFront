import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getUsuarios, createUsuario, updateUsuario, deleteUsuario } from '../api/usuarios';
import type { Usuario, PagedResult } from '../types';
import Modal from '../components/Modal';
import Pagination from '../components/Pagination';
import { useForm } from 'react-hook-form';

interface FormData {
  nome: string;
  email: string;
  senha: string;
  role: string;
}

export default function Usuarios() {
  const { isAdmin } = useAuth();
  const [result, setResult] = useState<PagedResult<Usuario> | null>(null);
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState<'create' | 'edit' | null>(null);
  const [editing, setEditing] = useState<Usuario | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Usuario | null>(null);
  const [error, setError] = useState('');

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>();

  async function load() {
    setResult(await getUsuarios(page));
  }

  useEffect(() => { load(); }, [page]);

  function openCreate() {
    reset({ nome: '', email: '', senha: '', role: 'User' });
    setEditing(null);
    setModal('create');
    setError('');
  }

  function openEdit(u: Usuario) {
    reset({ nome: u.nome, email: u.email, senha: '', role: u.role });
    setEditing(u);
    setModal('edit');
    setError('');
  }

  async function onSubmit(data: FormData) {
    setError('');
    try {
      if (modal === 'create') {
        await createUsuario(data);
      } else if (editing) {
        await updateUsuario(editing.id_usuario, data);
      }
      setModal(null);
      load();
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setError(msg ?? 'Erro ao salvar.');
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    try {
      await deleteUsuario(deleteTarget.id_usuario);
      setDeleteTarget(null);
      load();
    } catch {
      setDeleteTarget(null);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-900">Usuários</h1>
        {isAdmin && (
          <button
            onClick={openCreate}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
          >
            <Plus size={16} /> Novo Usuário
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Nome</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Email</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Role</th>
              {isAdmin && <th className="px-4 py-3" />}
            </tr>
          </thead>
          <tbody>
            {result?.items.map((u) => (
              <tr key={u.id_usuario} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{u.nome}</td>
                <td className="px-4 py-3 text-gray-600">{u.email}</td>
                <td className="px-4 py-3">
                  <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${u.role === 'Admin' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-600'}`}>
                    {u.role}
                  </span>
                </td>
                {isAdmin && (
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => openEdit(u)} className="text-gray-400 hover:text-blue-600 transition"><Pencil size={15} /></button>
                      <button onClick={() => setDeleteTarget(u)} className="text-gray-400 hover:text-red-600 transition"><Trash2 size={15} /></button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
            {result?.items.length === 0 && (
              <tr><td colSpan={4} className="text-center py-8 text-gray-400">Nenhum usuário encontrado.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {result && <Pagination page={page} totalPages={result.totalPages} onPageChange={setPage} />}

      {(modal === 'create' || modal === 'edit') && (
        <Modal title={modal === 'create' ? 'Novo Usuário' : 'Editar Usuário'} onClose={() => setModal(null)}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Field label="Nome" error={errors.nome?.message}>
              <input {...register('nome', { required: 'Obrigatório' })} className={inputCls} />
            </Field>
            <Field label="Email" error={errors.email?.message}>
              <input type="email" {...register('email', { required: 'Obrigatório' })} className={inputCls} />
            </Field>
            <Field label={modal === 'edit' ? 'Nova Senha (opcional)' : 'Senha'} error={errors.senha?.message}>
              <input type="password" {...register('senha', modal === 'create' ? { required: 'Obrigatório', minLength: { value: 8, message: 'Mínimo 8 caracteres' } } : { minLength: { value: 8, message: 'Mínimo 8 caracteres' } })} className={inputCls} />
            </Field>
            <Field label="Role" error={errors.role?.message}>
              <select {...register('role', { required: 'Obrigatório' })} className={inputCls}>
                <option value="User">User</option>
                <option value="Admin">Admin</option>
              </select>
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
          <p className="text-gray-600 mb-6">Deseja excluir o usuário <strong>{deleteTarget.nome}</strong>?</p>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setDeleteTarget(null)} className="px-4 py-2 text-sm rounded-lg border border-gray-300 hover:bg-gray-50">Cancelar</button>
            <button onClick={confirmDelete} className="px-4 py-2 text-sm rounded-lg bg-red-600 text-white hover:bg-red-700">Excluir</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

const inputCls = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition';

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {children}
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  );
}
