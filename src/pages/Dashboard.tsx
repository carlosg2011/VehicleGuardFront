import { useEffect, useState } from 'react';
import { FileText, ClipboardCheck, CheckCircle, Clock, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getDashboard, type DashboardSummary } from '../api/dashboard';
import { getPropostas } from '../api/propostas';
import type { Proposta } from '../types';
import StatusBadge from '../components/StatusBadge';

interface Card {
  label: string;
  key: keyof DashboardSummary;
  icon: React.ElementType;
  color: string;
}

const cards: Card[] = [
  { label: 'Propostas', key: 'propostas', icon: FileText, color: 'bg-emerald-500' },
  { label: 'Vistorias', key: 'vistorias', icon: ClipboardCheck, color: 'bg-violet-500' },
  { label: 'Termos Assinados', key: 'termosAssinados', icon: CheckCircle, color: 'bg-teal-500' },
  { label: 'Termos Pendentes', key: 'termosPendentes', icon: Clock, color: 'bg-orange-500' },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [recent, setRecent] = useState<Proposta[]>([]);

  useEffect(() => {
    const uid = isAdmin ? undefined : user?.id;
    getDashboard(uid).then(setSummary);
    getPropostas(1, 5, uid).then((r) => setRecent(r.items));
  }, [user, isAdmin]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Olá, {user?.nome}</h1>
      <p className="text-gray-500 mb-8">Bem-vindo ao painel Vehicle Guard.</p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        {cards.map(({ label, key, icon: Icon, color }) => (
          <div
            key={key}
            className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 flex flex-col items-center gap-3"
          >
            <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center`}>
              <Icon size={22} className="text-white" />
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {summary ? summary[key] : '—'}
            </p>
            <p className="text-xs font-medium text-gray-500 text-center">{label}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-700">Atividades Recentes</h2>
        </div>
        {recent.length === 0 ? (
          <p className="text-center py-8 text-gray-400 text-sm">Nenhuma atividade recente.</p>
        ) : (
          <ul className="divide-y divide-gray-50">
            {recent.map((p) => (
              <li
                key={p.id_proposta}
                onClick={() => navigate(`/propostas/${p.id_proposta}`)}
                className="flex items-center justify-between px-5 py-3.5 hover:bg-blue-50 cursor-pointer transition"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                    <FileText size={15} className="text-blue-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{p.sessaoProposta}</p>
                    <p className="text-xs text-gray-400">{new Date(p.dataCriacao).toLocaleDateString('pt-BR')}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={p.status} />
                  <ChevronRight size={15} className="text-gray-300" />
                </div>
              </li>
            ))}
          </ul>
        )}
        <div className="px-5 py-3 border-t border-gray-50">
          <button
            onClick={() => navigate('/propostas')}
            className="text-xs text-blue-600 hover:underline"
          >
            Ver todas as propostas →
          </button>
        </div>
      </div>
    </div>
  );
}
