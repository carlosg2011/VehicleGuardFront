import { useEffect, useState } from 'react';
import { FileText, ClipboardCheck, ScrollText, TrendingUp } from 'lucide-react';
import { getPropostas } from '../api/propostas';
import { getVistorias } from '../api/vistorias';
import { getTermos } from '../api/termos';

function countByStatus<T extends { status: string }>(items: T[]): Record<string, number> {
  return items.reduce((acc, item) => {
    acc[item.status] = (acc[item.status] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);
}

interface BarConfig {
  key: string;
  label: string;
  color: string;
}

const propostasBars: BarConfig[] = [
  { key: 'Aprovada',  label: 'Aprovada',    color: 'bg-green-500'  },
  { key: 'EmAnalise', label: 'Em Análise',  color: 'bg-blue-500'   },
  { key: 'Pendente',  label: 'Pendente',    color: 'bg-yellow-400' },
  { key: 'Recusada',  label: 'Recusada',    color: 'bg-red-500'    },
  { key: 'Cancelada', label: 'Cancelada',   color: 'bg-gray-400'   },
];

const vistoriasBars: BarConfig[] = [
  { key: 'Concluida',   label: 'Concluída',    color: 'bg-green-500'  },
  { key: 'Aprovada',    label: 'Aprovada',     color: 'bg-teal-500'   },
  { key: 'Pendente',    label: 'Pendente',     color: 'bg-yellow-400' },
  { key: 'NaoIniciada', label: 'Não Iniciada', color: 'bg-gray-400'   },
  { key: 'Recusada',    label: 'Recusada',     color: 'bg-red-500'    },
  { key: 'Cancelada',   label: 'Cancelada',    color: 'bg-red-300'    },
  { key: 'Expirada',    label: 'Expirada',     color: 'bg-orange-400' },
];

const termosBars: BarConfig[] = [
  { key: 'Assinado',  label: 'Assinado',  color: 'bg-blue-500'   },
  { key: 'Ativo',     label: 'Ativo',     color: 'bg-green-500'  },
  { key: 'Cancelado', label: 'Cancelado', color: 'bg-red-400'    },
  { key: 'Expirado',  label: 'Expirado',  color: 'bg-orange-400' },
];

function StatusBar({ bars, counts, total }: { bars: BarConfig[]; counts: Record<string, number>; total: number }) {
  return (
    <div className="space-y-3">
      {bars.map(({ key, label, color }) => {
        const count = counts[key] ?? 0;
        const pct = total > 0 ? (count / total) * 100 : 0;
        return (
          <div key={key}>
            <div className="flex justify-between text-xs text-gray-600 mb-1">
              <span>{label}</span>
              <span className="font-medium">
                {count} <span className="text-gray-400">({pct.toFixed(0)}%)</span>
              </span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function SummaryCard({
  icon: Icon,
  color,
  label,
  value,
}: {
  icon: React.ElementType;
  color: string;
  label: string;
  value: number | string;
}) {
  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 flex flex-col items-center gap-3 text-center">
      <div className={`w-11 h-11 rounded-xl ${color} flex items-center justify-center`}>
        <Icon size={20} className="text-white" />
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-xs font-medium text-gray-500">{label}</p>
    </div>
  );
}

export default function Relatorios() {
  const [loading, setLoading] = useState(true);
  const [propostasCounts, setPropostasCounts] = useState<Record<string, number>>({});
  const [vistoriasCounts, setVistoriasCounts] = useState<Record<string, number>>({});
  const [termosCounts, setTermosCounts] = useState<Record<string, number>>({});
  const [totals, setTotals] = useState({ propostas: 0, vistorias: 0, termos: 0 });

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [pResult, vResult, tResult] = await Promise.all([
          getPropostas(1, 200),
          getVistorias(1, 200),
          getTermos(1, 200),
        ]);
        setPropostasCounts(countByStatus(pResult.items));
        setVistoriasCounts(countByStatus(vResult.items));
        setTermosCounts(countByStatus(tResult.items));
        setTotals({
          propostas: pResult.totalCount,
          vistorias: vResult.totalCount,
          termos: tResult.totalCount,
        });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const taxaAprovacao =
    totals.propostas > 0
      ? (((propostasCounts['Aprovada'] ?? 0) / totals.propostas) * 100).toFixed(0)
      : '0';

  const taxaAssinatura =
    totals.termos > 0
      ? (((termosCounts['Assinado'] ?? 0) / totals.termos) * 100).toFixed(0)
      : '0';

  if (loading) {
    return <div className="flex items-center justify-center h-48 text-gray-400 text-sm">Carregando...</div>;
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Relatórios</h1>
        <p className="text-sm text-gray-500 mt-1">Visão geral da sua carteira</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <SummaryCard icon={FileText}       color="bg-emerald-500" label="Total de Propostas"  value={totals.propostas} />
        <SummaryCard icon={ClipboardCheck} color="bg-violet-500"  label="Total de Vistorias"  value={totals.vistorias} />
        <SummaryCard icon={ScrollText}     color="bg-blue-500"    label="Termos Assinados"    value={termosCounts['Assinado'] ?? 0} />
        <SummaryCard icon={TrendingUp}     color="bg-teal-500"    label="Taxa de Aprovação"   value={`${taxaAprovacao}%`} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wide">Propostas por Status</h2>
          <StatusBar bars={propostasBars} counts={propostasCounts} total={totals.propostas} />
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wide">Vistorias por Status</h2>
          <StatusBar bars={vistoriasBars} counts={vistoriasCounts} total={totals.vistorias} />
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wide">Termos por Status</h2>
          <StatusBar bars={termosBars} counts={termosCounts} total={totals.termos} />
          <div className="mt-5 pt-4 border-t border-gray-100">
            <p className="text-xs text-gray-500 mb-0.5">Taxa de assinatura</p>
            <p className="text-2xl font-bold text-gray-900">{taxaAssinatura}%</p>
          </div>
        </div>
      </div>
    </div>
  );
}
