import { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Check, X, ImagePlus } from 'lucide-react';
import { getVistorias, getVistoria, updateVistoria } from '../api/vistorias';
import type { Vistoria, PagedResult } from '../types';
import Modal from '../components/Modal';
import Pagination from '../components/Pagination';
import StatusBadge from '../components/StatusBadge';
import { useAuth } from '../contexts/AuthContext';

interface Photo {
  id: string;
  url: string;
  name: string;
  verdict: 'pending' | 'approved' | 'rejected';
}

function toUtc(iso: string): Date {
  const s = iso.endsWith('Z') || iso.includes('+') ? iso : iso + 'Z';
  return new Date(s);
}

function getPrazo(dataSolicitacao: string, status: string, now: Date): string {
  if (status === 'Concluida' || status === 'Aprovada' || status === 'Cancelada') return '—';
  const deadline = new Date(toUtc(dataSolicitacao).getTime() + 24 * 60 * 60 * 1000);
  const diff = deadline.getTime() - now.getTime();
  if (diff <= 0) return 'Expirado';
  const h = Math.floor(diff / 3_600_000);
  const m = Math.floor((diff % 3_600_000) / 60_000);
  return `${h}h ${m}m`;
}

function PrazoCell({ dataSolicitacao, status, now }: { dataSolicitacao: string; status: string; now: Date }) {
  const label = getPrazo(dataSolicitacao, status, now);
  const expired = label === 'Expirado';
  const done = label === '—';
  return (
    <span className={done ? 'text-gray-400' : expired ? 'text-red-500 font-medium' : 'text-amber-600 font-medium'}>
      {label}
    </span>
  );
}

export default function Vistorias() {
  const [result, setResult] = useState<PagedResult<Vistoria> | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [inspectTarget, setInspectTarget] = useState<Vistoria | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState('');
  const [now, setNow] = useState(new Date());
  const fileInputRef = useRef<HTMLInputElement>(null);
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
      setResult(await getVistorias(page, 10, user?.id));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [page]);

  function openInspect(v: Vistoria) {
    setPhotos([]);
    setError('');
    setInspectTarget(v);
  }

  function handleAddPhotos(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    const newPhotos: Photo[] = files.map((f) => ({
      id: crypto.randomUUID(),
      url: URL.createObjectURL(f),
      name: f.name,
      verdict: 'pending',
    }));
    setPhotos((prev) => [...prev, ...newPhotos]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function setPhotoVerdict(id: string, verdict: 'approved' | 'rejected') {
    setPhotos((prev) =>
      prev.map((p) => (p.id === id ? { ...p, verdict: p.verdict === verdict ? 'pending' : verdict } : p))
    );
  }

  async function confirmVistoria() {
    if (!inspectTarget) return;
    if (photos.length < 14) {
      setError(`Anexe 14 fotos para confirmar a vistoria. Adicionadas: ${photos.length}/14.`);
      return;
    }
    setConfirming(true);
    setError('');
    try {
      await updateVistoria(inspectTarget.id_vistoria, {
        status: 'Concluida',
        dataInicio: inspectTarget.dataInicio ?? inspectTarget.dataSolicitacao,
        dataConclusao: new Date().toISOString(),
      });
      setInspectTarget(null);
      load();
    } catch {
      setError('Erro ao confirmar vistoria. Tente novamente.');
    } finally {
      setConfirming(false);
    }
  }

  const verdictBorder = (p: Photo) =>
    p.verdict === 'approved' ? 'border-green-400' : p.verdict === 'rejected' ? 'border-red-400' : 'border-gray-200';

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Vistorias</h1>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">ID</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Associado</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Placa</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Proposta</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Solicitação</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Prazo (24h)</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="text-center py-10 text-gray-400">Carregando...</td></tr>
            ) : result?.items.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-8 text-gray-400">Nenhuma vistoria encontrada.</td></tr>
            ) : result?.items.map((v) => (
              <tr
                key={v.id_vistoria}
                onClick={() => openInspect(v)}
                className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer"
              >
                <td className="px-4 py-3 text-gray-500">#{v.id_vistoria}</td>
                <td className="px-4 py-3"><StatusBadge status={v.status} /></td>
                <td className="px-4 py-3 text-gray-800">{v.nomeProprietario || '—'}</td>
                <td className="px-4 py-3 font-mono text-gray-700">{v.placa || '—'}</td>
                <td className="px-4 py-3 font-mono text-gray-700">{v.sessaoProposta}</td>
                <td className="px-4 py-3 text-gray-600">{new Date(v.dataSolicitacao).toLocaleDateString('pt-BR')}</td>
                <td className="px-4 py-3">
                  <PrazoCell dataSolicitacao={v.dataSolicitacao} status={v.status} now={now} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {result && <Pagination page={page} totalPages={result.totalPages} onPageChange={setPage} />}

      {inspectTarget && (
        <Modal title={`Inspecionar Vistoria #${inspectTarget.id_vistoria}`} onClose={() => setInspectTarget(null)}>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-600 mb-5 pb-4 border-b border-gray-100">
            <span>Associado: <strong className="text-gray-800">{inspectTarget.nomeProprietario || '—'}</strong></span>
            <span>Placa: <span className="font-mono font-semibold text-gray-800">{inspectTarget.placa || '—'}</span></span>
            <span>Proposta: <span className="font-mono font-semibold text-gray-800">{inspectTarget.sessaoProposta}</span></span>
            <span className="flex items-center gap-1.5">Status: <StatusBadge status={inspectTarget.status} /></span>
          </div>

          {inspectTarget.status === 'Cancelada' ? (
            <div className="flex justify-end pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setInspectTarget(null)}
                className="px-4 py-2 text-sm rounded-lg border border-gray-300 hover:bg-gray-50"
              >
                Fechar
              </button>
            </div>
          ) : (
            <>
              <div className="mb-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-semibold text-gray-700">
                    Fotos da Vistoria
                    <span className="ml-2 text-xs font-normal text-gray-400">({photos.length}/14)</span>
                  </p>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 border border-blue-200 rounded-lg px-3 py-1.5 hover:bg-blue-50 transition"
                  >
                    <ImagePlus size={13} />
                    Adicionar Fotos
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleAddPhotos}
                  />
                </div>

                {photos.length === 0 ? (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center text-gray-400 text-sm cursor-pointer hover:border-blue-300 hover:text-blue-400 transition"
                  >
                    Clique para adicionar as 14 fotos obrigatórias
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-3 max-h-64 overflow-y-auto pr-1">
                    {photos.map((photo) => (
                      <div key={photo.id} className={`border-2 rounded-xl overflow-hidden transition ${verdictBorder(photo)}`}>
                        <img src={photo.url} alt={photo.name} className="w-full h-24 object-cover" />
                        <div className="p-1.5">
                          <p className="text-xs text-gray-500 truncate mb-1.5">{photo.name}</p>
                          <div className="flex gap-1">
                            <button
                              type="button"
                              onClick={() => setPhotoVerdict(photo.id, 'approved')}
                              title="Aprovar"
                              className={`flex-1 flex items-center justify-center py-1 rounded-md transition ${
                                photo.verdict === 'approved'
                                  ? 'bg-green-500 text-white'
                                  : 'bg-gray-100 text-gray-500 hover:bg-green-100 hover:text-green-600'
                              }`}
                            >
                              <Check size={12} />
                            </button>
                            <button
                              type="button"
                              onClick={() => setPhotoVerdict(photo.id, 'rejected')}
                              title="Recusar"
                              className={`flex-1 flex items-center justify-center py-1 rounded-md transition ${
                                photo.verdict === 'rejected'
                                  ? 'bg-red-500 text-white'
                                  : 'bg-gray-100 text-gray-500 hover:bg-red-100 hover:text-red-600'
                              }`}
                            >
                              <X size={12} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {error && <p className="text-sm text-red-600 bg-red-50 rounded px-3 py-2 mb-4">{error}</p>}

              <div className="flex gap-2 justify-end pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setInspectTarget(null)}
                  className="px-4 py-2 text-sm rounded-lg border border-gray-300 hover:bg-gray-50"
                >
                  Fechar
                </button>
                <button
                  type="button"
                  onClick={confirmVistoria}
                  disabled={confirming || inspectTarget.status === 'Concluida'}
                  className="px-4 py-2 text-sm rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-60"
                >
                  {confirming
                    ? 'Confirmando...'
                    : inspectTarget.status === 'Concluida'
                    ? 'Vistoria Concluída'
                    : `Confirmar Vistoria (${photos.length}/14)`}
                </button>
              </div>
            </>
          )}
        </Modal>
      )}
    </div>
  );
}
