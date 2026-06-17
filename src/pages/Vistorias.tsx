import { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Check, X, Upload, ZoomIn, ChevronDown, ArrowLeft, AlertTriangle } from 'lucide-react';
import { getVistorias, getVistoria, updateVistoria, upsertVistoriaFoto } from '../api/vistorias';
import { uploadToCloudinary } from '../utils/cloudinary';
import type { Vistoria, StatusVistoria } from '../types';
import Pagination from '../components/Pagination';
import StatusBadge from '../components/StatusBadge';
import { useAuth } from '../contexts/AuthContext';

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME as string;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET as string;

const SLOTS = [
  'Frente', 'Traseira', 'Lateral Esquerda', 'Lateral Direita',
  'Motor', 'Painel', 'Interior', 'Porta-malas',
  'Pneu Dianteiro Esq.', 'Pneu Dianteiro Dir.',
  'Pneu Traseiro Esq.', 'Pneu Traseiro Dir.',
  'Chassi', 'Teto',
];

const STATUS_OPTIONS: { value: StatusVistoria | ''; label: string }[] = [
  { value: '', label: 'Todos os status' },
  { value: 'Pendente', label: 'Pendente' },
  { value: 'Concluida', label: 'Concluída' },
  { value: 'Aprovada', label: 'Aprovada' },
  { value: 'Recusada', label: 'Recusada' },
  { value: 'Cancelada', label: 'Cancelada' },
  { value: 'Expirada', label: 'Expirada' },
];

function toUtc(iso: string): Date {
  const s = iso.endsWith('Z') || iso.includes('+') ? iso : iso + 'Z';
  return new Date(s);
}

function getPrazo(dataSolicitacao: string, status: string, now: Date): string {
  if (['Concluida', 'Aprovada', 'Recusada', 'Cancelada', 'Expirada'].includes(status)) return '—';
  const deadline = new Date(toUtc(dataSolicitacao).getTime() + 24 * 60 * 60 * 1000);
  const diff = deadline.getTime() - now.getTime();
  if (diff <= 0) return 'Expirado';
  const h = Math.floor(diff / 3_600_000);
  const m = Math.floor((diff % 3_600_000) / 60_000);
  return `${h}h ${m}m`;
}

export default function Vistorias() {
  const [result, setResult] = useState<{ items: Vistoria[]; totalPages: number } | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusVistoria | ''>('');
  const [inspectTarget, setInspectTarget] = useState<Vistoria | null>(null);
  const [uploading, setUploading] = useState<Record<string, boolean>>({});
  const [uploadError, setUploadError] = useState<Record<string, string>>({});
  const [verdicts, setVerdicts] = useState<Record<string, 'approved' | 'rejected' | null>>({});
  const [observacoes, setObservacoes] = useState('');
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState('');
  const [lightbox, setLightbox] = useState<string | null>(null);
  const [now, setNow] = useState(new Date());
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const [searchParams] = useSearchParams();
  const { user } = useAuth();

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const openId = Number(searchParams.get('open'));
    if (!openId) return;
    getVistoria(openId).then(openInspect).catch(() => {});
  }, []);

  async function load() {
    setLoading(true);
    try {
      const data = await getVistorias(page, 10, user?.id);
      const filtered = statusFilter
        ? { ...data, items: data.items.filter((v) => v.status === statusFilter) }
        : data;
      setResult(filtered);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [page, statusFilter]);

  function openInspect(v: Vistoria) {
    setInspectTarget(v);
    setObservacoes(v.observacoes ?? '');
    setActionError('');
    setUploadError({});
    const initialVerdicts: Record<string, 'approved' | 'rejected' | null> = {};
    for (const f of v.fotos) initialVerdicts[f.slot] = f.verdict;
    setVerdicts(initialVerdicts);
  }

  function slotUrl(slot: string): string | null {
    return inspectTarget?.fotos.find((f) => f.slot === slot)?.url ?? null;
  }

  async function handleSlotUpload(slot: string, file: File) {
    if (!inspectTarget) return;
    if (!CLOUD_NAME || !UPLOAD_PRESET) {
      setUploadError((p) => ({ ...p, [slot]: 'Cloudinary não configurado.' }));
      return;
    }
    setUploading((p) => ({ ...p, [slot]: true }));
    setUploadError((p) => ({ ...p, [slot]: '' }));
    try {
      const url = await uploadToCloudinary(file, CLOUD_NAME, UPLOAD_PRESET);
      await upsertVistoriaFoto(inspectTarget.id_vistoria, { slot, url, verdict: verdicts[slot] });
      setInspectTarget((prev) => {
        if (!prev) return prev;
        const fotos = prev.fotos.filter((f) => f.slot !== slot);
        fotos.push({ id_foto: 0, slot, url, verdict: verdicts[slot] ?? null });
        return { ...prev, fotos };
      });
    } catch {
      setUploadError((p) => ({ ...p, [slot]: 'Erro ao enviar.' }));
    } finally {
      setUploading((p) => ({ ...p, [slot]: false }));
    }
  }

  async function handleVerdict(slot: string, verdict: 'approved' | 'rejected') {
    if (!inspectTarget) return;
    const url = slotUrl(slot);
    if (!url) return;
    const newVerdict = verdicts[slot] === verdict ? null : verdict;
    setVerdicts((p) => ({ ...p, [slot]: newVerdict }));
    await upsertVistoriaFoto(inspectTarget.id_vistoria, { slot, url, verdict: newVerdict }).catch(() => {});
  }

  async function handleAction(status: StatusVistoria) {
    if (!inspectTarget) return;
    const filled = SLOTS.filter((s) => slotUrl(s)).length;
    if (filled < 14) {
      setActionError(`Anexe todas as 14 fotos antes de continuar. (${filled}/14)`);
      return;
    }
    if (status === 'Aprovada') {
      const rejectedCount = Object.values(verdicts).filter((v) => v === 'rejected').length;
      if (rejectedCount > 0) {
        setActionError(`${rejectedCount} foto(s) reprovada(s). Revise os veredictos antes de aprovar.`);
        return;
      }
    }
    setSaving(true);
    setActionError('');
    try {
      await updateVistoria(inspectTarget.id_vistoria, {
        status,
        dataInicio: inspectTarget.dataInicio ?? inspectTarget.dataSolicitacao,
        dataConclusao: new Date().toISOString(),
        observacoes: observacoes || null,
      });
      setInspectTarget(null);
      load();
    } catch {
      setActionError('Erro ao salvar. Tente novamente.');
    } finally {
      setSaving(false);
    }
  }

  const filledCount = inspectTarget ? SLOTS.filter((s) => slotUrl(s)).length : 0;
  const isClosed = inspectTarget
    ? ['Aprovada', 'Recusada', 'Cancelada', 'Expirada'].includes(inspectTarget.status)
    : false;

  /* ── Tela de inspeção (full-screen) ─────────────────────────────── */
  if (inspectTarget) {
    return (
      <div className="flex flex-col h-full min-h-screen bg-gray-50 -m-4 md:-m-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-100 shadow-sm sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setInspectTarget(null)}
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition"
            >
              <ArrowLeft size={16} /> Voltar
            </button>
            <span className="text-gray-300">|</span>
            <h1 className="text-base font-semibold text-gray-900">Vistoria #{inspectTarget.id_vistoria}</h1>
            <StatusBadge status={inspectTarget.status} />
          </div>
          <div className="hidden sm:flex items-center gap-3 text-sm text-gray-600">
            <span><strong className="text-gray-800">{inspectTarget.nomeProprietario}</strong></span>
            <span className="font-mono bg-gray-100 px-2 py-0.5 rounded text-gray-700">{inspectTarget.placa}</span>
            <span className="hidden md:inline text-gray-400">{inspectTarget.sessaoProposta}</span>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 flex flex-col md:flex-row overflow-y-auto md:overflow-hidden">
          {/* Fotos — painel principal */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-800">
                Fotos da Vistoria
                <span className={`ml-2 text-sm font-normal ${filledCount === 14 ? 'text-green-600' : 'text-gray-400'}`}>
                  ({filledCount}/14)
                </span>
              </h2>
              {/* Barra de progresso */}
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <div className="w-32 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${filledCount === 14 ? 'bg-green-500' : 'bg-blue-500'}`}
                    style={{ width: `${(filledCount / 14) * 100}%` }}
                  />
                </div>
                {filledCount}/14
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {SLOTS.map((slot) => {
                const url = slotUrl(slot);
                const verdict = verdicts[slot];
                const isUploading = uploading[slot];
                const err = uploadError[slot];
                return (
                  <div
                    key={slot}
                    className={`border-2 rounded-xl overflow-hidden bg-white transition shadow-sm ${
                      verdict === 'approved' ? 'border-green-400' :
                      verdict === 'rejected' ? 'border-red-400' :
                      url ? 'border-blue-300' : 'border-gray-200'
                    }`}
                  >
                    {url ? (
                      <>
                        <div className="relative group">
                          <img src={url} alt={slot} className="w-full h-40 object-cover" />
                          <button
                            type="button"
                            onClick={() => setLightbox(url)}
                            className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition rounded-t-xl"
                          >
                            <ZoomIn size={24} className="text-white" />
                          </button>
                        </div>
                        <div className="p-2">
                          <p className="text-xs text-gray-600 font-medium truncate mb-2">{slot}</p>
                          {!isClosed && (
                            <div className="flex gap-1">
                              <button type="button" onClick={() => handleVerdict(slot, 'approved')}
                                title="Aprovar foto"
                                className={`flex-1 flex items-center justify-center py-1.5 rounded-lg text-xs font-medium transition ${
                                  verdict === 'approved' ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-500 hover:bg-green-50 hover:text-green-600'
                                }`}>
                                <Check size={13} />
                              </button>
                              <button type="button" onClick={() => handleVerdict(slot, 'rejected')}
                                title="Reprovar foto"
                                className={`flex-1 flex items-center justify-center py-1.5 rounded-lg text-xs font-medium transition ${
                                  verdict === 'rejected' ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-500 hover:bg-red-50 hover:text-red-600'
                                }`}>
                                <X size={13} />
                              </button>
                              <button type="button" onClick={() => fileRefs.current[slot]?.click()}
                                title="Trocar foto"
                                className="flex-1 flex items-center justify-center py-1.5 rounded-lg bg-gray-100 text-gray-500 hover:bg-blue-50 hover:text-blue-600 transition">
                                <Upload size={13} />
                              </button>
                            </div>
                          )}
                        </div>
                      </>
                    ) : (
                      <button
                        type="button"
                        disabled={isClosed || isUploading}
                        onClick={() => fileRefs.current[slot]?.click()}
                        className="w-full flex flex-col items-center justify-center gap-2 py-10 text-gray-400 hover:text-blue-500 hover:bg-blue-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isUploading ? (
                          <span className="text-xs animate-pulse">Enviando...</span>
                        ) : (
                          <>
                            <Upload size={20} />
                            <span className="text-xs font-medium text-center px-2">{slot}</span>
                            {err && (
                              <span className="text-xs text-red-500 flex items-center gap-1">
                                <AlertTriangle size={11} /> {err}
                              </span>
                            )}
                          </>
                        )}
                      </button>
                    )}
                    <input
                      ref={(el) => { fileRefs.current[slot] = el; }}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleSlotUpload(slot, file);
                        e.target.value = '';
                      }}
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Painel lateral direito */}
          <div className="md:w-72 xl:w-80 border-t md:border-t-0 md:border-l border-gray-100 bg-white flex flex-col md:overflow-y-auto">
            <div className="flex-1 p-5 space-y-5">
              {/* Detalhes */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">Detalhes</p>
                <dl className="text-sm space-y-1.5">
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Solicitação</dt>
                    <dd className="text-gray-800 font-medium">
                      {new Date(inspectTarget.dataSolicitacao).toLocaleDateString('pt-BR')}
                    </dd>
                  </div>
                  {inspectTarget.dataInicio && (
                    <div className="flex justify-between">
                      <dt className="text-gray-500">Início</dt>
                      <dd className="text-gray-800 font-medium">
                        {new Date(inspectTarget.dataInicio).toLocaleDateString('pt-BR')}
                      </dd>
                    </div>
                  )}
                  {inspectTarget.dataConclusao && (
                    <div className="flex justify-between">
                      <dt className="text-gray-500">Conclusão</dt>
                      <dd className="text-gray-800 font-medium">
                        {new Date(inspectTarget.dataConclusao).toLocaleDateString('pt-BR')}
                      </dd>
                    </div>
                  )}
                </dl>
              </div>

              {/* Resumo de aprovações */}
              {filledCount > 0 && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">Análise</p>
                  <div className="flex gap-2">
                    <div className="flex-1 bg-green-50 rounded-lg p-2 text-center">
                      <p className="text-lg font-bold text-green-600">
                        {Object.values(verdicts).filter((v) => v === 'approved').length}
                      </p>
                      <p className="text-xs text-green-700">Aprovadas</p>
                    </div>
                    <div className="flex-1 bg-red-50 rounded-lg p-2 text-center">
                      <p className="text-lg font-bold text-red-600">
                        {Object.values(verdicts).filter((v) => v === 'rejected').length}
                      </p>
                      <p className="text-xs text-red-700">Reprovadas</p>
                    </div>
                    <div className="flex-1 bg-gray-50 rounded-lg p-2 text-center">
                      <p className="text-lg font-bold text-gray-600">
                        {filledCount - Object.values(verdicts).filter((v) => v !== null).length}
                      </p>
                      <p className="text-xs text-gray-500">Pendentes</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Observações */}
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2 block">
                  Observações
                </label>
                {isClosed ? (
                  <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3 min-h-[80px]">
                    {inspectTarget.observacoes || <span className="text-gray-400 italic">Nenhuma observação.</span>}
                  </p>
                ) : (
                  <textarea
                    value={observacoes}
                    onChange={(e) => setObservacoes(e.target.value)}
                    rows={5}
                    maxLength={1000}
                    placeholder="Anotações sobre o estado do veículo, itens verificados, pendências..."
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition resize-none"
                  />
                )}
              </div>
            </div>

            {/* Ações */}
            {!isClosed && (
              <div className="p-5 border-t border-gray-100 space-y-2">
                {actionError && (
                  <p className="text-xs text-red-600 bg-red-50 rounded px-3 py-2 flex items-start gap-1.5">
                    <AlertTriangle size={13} className="mt-0.5 shrink-0" /> {actionError}
                  </p>
                )}
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => handleAction('Aprovada')}
                  className="w-full py-2.5 text-sm font-medium rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-60 transition"
                >
                  {saving ? 'Salvando...' : `Aprovar Vistoria (${filledCount}/14)`}
                </button>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => handleAction('Recusada')}
                  className="w-full py-2.5 text-sm font-medium rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-60 transition"
                >
                  {saving ? 'Salvando...' : 'Recusar Vistoria'}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Lightbox */}
        {lightbox && (
          <div
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-6"
            onClick={() => setLightbox(null)}
          >
            <img
              src={lightbox}
              alt="Foto ampliada"
              className="max-w-full max-h-full rounded-xl shadow-2xl object-contain"
              onClick={(e) => e.stopPropagation()}
            />
            <button onClick={() => setLightbox(null)} className="absolute top-5 right-5 text-white/80 hover:text-white">
              <X size={30} />
            </button>
          </div>
        )}
      </div>
    );
  }

  /* ── Lista de vistorias ─────────────────────────────────────────── */
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-900">Vistorias</h1>
        <div className="relative">
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value as StatusVistoria | ''); setPage(1); }}
            className="appearance-none bg-white border border-gray-200 rounded-lg pl-3 pr-8 py-2 text-sm text-gray-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 cursor-pointer"
          >
            {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[640px]">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">ID</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Associado</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Placa</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Proposta</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Fotos</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Prazo (24h)</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="text-center py-10 text-gray-400">Carregando...</td></tr>
              ) : result?.items.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-8 text-gray-400">Nenhuma vistoria encontrada.</td></tr>
              ) : result?.items.map((v) => {
                const prazo = getPrazo(v.dataSolicitacao, v.status, now);
                const expired = prazo === 'Expirado';
                const done = prazo === '—';
                return (
                  <tr key={v.id_vistoria} onClick={() => openInspect(v)} className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors">
                    <td className="px-4 py-3 text-gray-500">#{v.id_vistoria}</td>
                    <td className="px-4 py-3"><StatusBadge status={v.status} /></td>
                    <td className="px-4 py-3 text-gray-800">{v.nomeProprietario || '—'}</td>
                    <td className="px-4 py-3 font-mono text-gray-700">{v.placa || '—'}</td>
                    <td className="px-4 py-3 font-mono text-gray-700">{v.sessaoProposta}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium ${v.fotos.length === 14 ? 'text-green-600' : 'text-gray-500'}`}>
                        {v.fotos.length}/14
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={done ? 'text-gray-400' : expired ? 'text-red-500 font-medium' : 'text-amber-600 font-medium'}>
                        {prazo}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {result && <Pagination page={page} totalPages={result.totalPages} onPageChange={setPage} />}
    </div>
  );
}
