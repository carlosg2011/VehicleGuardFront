const colorMap: Record<string, string> = {
  Ativo: 'bg-green-100 text-green-800',
  Inativo: 'bg-gray-100 text-gray-600',
  Bloqueado: 'bg-red-100 text-red-800',
  Pendente: 'bg-yellow-100 text-yellow-800',
  EmAnalise: 'bg-blue-100 text-blue-800',
  Aprovada: 'bg-green-100 text-green-800',
  Recusada: 'bg-red-100 text-red-800',
  Cancelada: 'bg-red-100 text-red-800',
  NaoIniciada: 'bg-slate-100 text-slate-600',
  Concluida: 'bg-teal-100 text-teal-800',
  Expirada: 'bg-orange-100 text-orange-800',
  Expirado: 'bg-orange-100 text-orange-800',
  Cancelado: 'bg-gray-100 text-gray-600',
};

const labelMap: Record<string, string> = {
  EmAnalise: 'Em Análise',
  NaoIniciada: 'Não Iniciada',
};

export default function StatusBadge({ status }: { status: string }) {
  const color = colorMap[status] ?? 'bg-gray-100 text-gray-600';
  const label = labelMap[status] ?? status;
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${color}`}>
      {label}
    </span>
  );
}
