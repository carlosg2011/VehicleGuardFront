import { useEffect, useState } from 'react';
import { getTermos } from '../api/termos';
import type { Termo, PagedResult } from '../types';
import Pagination from '../components/Pagination';
import StatusBadge from '../components/StatusBadge';
import { useAuth } from '../contexts/AuthContext';

export default function Termos() {
  const [result, setResult] = useState<PagedResult<Termo> | null>(null);
  const [page, setPage] = useState(1);

  const { user, isAdmin } = useAuth();

  async function load() {
    setResult(await getTermos(page, 10, isAdmin ? undefined : user?.id));
  }

  useEffect(() => { load(); }, [page]);

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
              </tr>
            ))}
            {result?.items.length === 0 && (
              <tr><td colSpan={5} className="text-center py-8 text-gray-400">Nenhum termo encontrado.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {result && <Pagination page={page} totalPages={result.totalPages} onPageChange={setPage} />}
    </div>
  );
}
