import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ClipboardCheck, Eye, FileText, ScrollText } from 'lucide-react';
import { getProposta } from '../api/propostas';
import { getProprietario } from '../api/proprietarios';
import { getVeiculo } from '../api/veiculos';
import { createVistoria, updateVistoria, getVistorias } from '../api/vistorias';
import { createTermo, getTermoPorProposta } from '../api/termos';
import type { Proposta, Proprietario, Veiculo, Vistoria, Termo } from '../types';
import Modal from '../components/Modal';
import StatusBadge from '../components/StatusBadge';
import { useAuth } from '../contexts/AuthContext';

function InfoRow({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div>
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">{label}</p>
      <p className="text-sm font-medium text-gray-900 dark:text-white">{value ?? '—'}</p>
    </div>
  );
}

export default function PropostaDetalhe() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [proposta, setProposta] = useState<Proposta | null>(null);
  const [proprietario, setProprietario] = useState<Proprietario | null>(null);
  const [veiculo, setVeiculo] = useState<Veiculo | null>(null);
  const [vistoria, setVistoria] = useState<Vistoria | null>(null);
  const [termo, setTermo] = useState<Termo | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirmModal, setConfirmModal] = useState(false);
  const [dadosModal, setDadosModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [cancelando, setCancelando] = useState(false);
  const [gerandoTermo, setGerandoTermo] = useState(false);
  const [error, setError] = useState('');

  async function load() {
    if (!id) return;
    setLoading(true);
    try {
      const p = await getProposta(Number(id));
      const [prop, veic, vistorias, termoAtivo] = await Promise.all([
        getProprietario(p.id_proprietario),
        getVeiculo(p.id_veiculo),
        getVistorias(1, 10, undefined, p.id_proposta, true),
        getTermoPorProposta(p.id_proposta).catch(() => null),
      ]);
      setProposta(p);
      setProprietario(prop);
      setVeiculo(veic);
      setVistoria(vistorias.items.find(v => v.status !== 'Cancelada') ?? null);
      setTermo(termoAtivo);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [id]);

  async function handleCriarVistoria() {
    if (!proposta) return;
    setError('');
    setSubmitting(true);
    try {
      await createVistoria({
        dataSolicitacao: new Date().toISOString(),
        status: 'NaoIniciada',
        id_proposta: proposta.id_proposta,
        id_usuario: user!.id,
      });
      setConfirmModal(false);
      await load();
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setError(msg ?? 'Erro ao criar vistoria.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCancelarVistoria() {
    if (!vistoria) return;
    setCancelando(true);
    setError('');
    try {
      await updateVistoria(vistoria.id_vistoria, {
        status: 'Cancelada',
        dataInicio: vistoria.dataInicio,
        dataConclusao: vistoria.dataConclusao,
      });
      setDadosModal(false);
      setVistoria(null);
      await load();
    } catch {
      setError('Erro ao cancelar vistoria. Tente novamente.');
    } finally {
      setCancelando(false);
    }
  }

  async function handleGerarTermo() {
    if (!proposta) return;
    setGerandoTermo(true);
    try {
      const novoTermo = await createTermo({
        numeroTermo: `TERMO-${proposta.sessaoProposta}`,
        status: 'Ativo',
        dataEnvio: new Date().toISOString(),
        dataAssinatura: null,
        id_proposta: proposta.id_proposta,
      });
      setTermo(novoTermo);
    } catch {
      setError('Erro ao gerar termo. Tente novamente.');
    } finally {
      setGerandoTermo(false);
    }
  }


  if (loading) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
        Carregando...
      </div>
    );
  }

  if (!proposta) {
    return (
      <div className="text-center py-16 text-gray-400">
        <p>Proposta não encontrada.</p>
        <button onClick={() => navigate('/propostas')} className="mt-4 text-blue-600 hover:underline text-sm">Voltar</button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-6">
        <button
          onClick={() => navigate('/propostas')}
          className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white transition"
        >
          <ArrowLeft size={16} />
          Voltar
        </button>
        <div className="flex items-center gap-2">
          {termo ? (
            <button
              onClick={() => navigate(`/termos/${termo.id_termo}`)}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
            >
              <ScrollText size={16} />
              Ver Termo
            </button>
          ) : proposta.status === 'Aprovada' && (
            <button
              onClick={handleGerarTermo}
              disabled={gerandoTermo}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition disabled:opacity-60"
            >
              <FileText size={16} />
              {gerandoTermo ? 'Gerando...' : 'Gerar Termo'}
            </button>
          )}
          {vistoria ? (
            <button
              onClick={() => setDadosModal(true)}
              className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
            >
              <Eye size={16} />
              Dados da Vistoria
            </button>
          ) : (
            <button
              onClick={() => { setError(''); setConfirmModal(true); }}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
            >
              <ClipboardCheck size={16} />
              Criar Vistoria
            </button>
          )}
        </div>
      </div>

      <div className="mb-4">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">{proposta.sessaoProposta}</h1>
          <StatusBadge status={proposta.status} />
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Criado em {new Date(proposta.dataCriacao).toLocaleDateString('pt-BR')} · Proposta #{proposta.id_proposta}
        </p>
      </div>

      <div className="space-y-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-5">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 uppercase tracking-wide">Proprietário</h2>
          {proprietario ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <InfoRow label="Nome" value={proprietario.nome} />
              <InfoRow label="CPF / CNPJ" value={proprietario.cpf} />
              <InfoRow label="Telefone" value={proprietario.telefone} />
              <InfoRow label="Email" value={proprietario.email} />
            </div>
          ) : (
            <p className="text-sm text-gray-400">Dados do proprietário indisponíveis.</p>
          )}
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-5">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 uppercase tracking-wide">Veículo</h2>
          {veiculo ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <InfoRow label="Placa" value={veiculo.placa} />
              <InfoRow label="Marca" value={veiculo.marca} />
              <InfoRow label="Modelo" value={veiculo.modelo} />
              <InfoRow label="Ano Fabricação" value={veiculo.anoFab} />
              <InfoRow label="Ano Modelo" value={veiculo.anoMod} />
              <InfoRow label="Cor" value={veiculo.cor} />
              <InfoRow label="Chassi" value={veiculo.chassi} />
              <InfoRow label="Renavam" value={veiculo.renavam} />
              <InfoRow label="Status" value={veiculo.status} />
            </div>
          ) : (
            <p className="text-sm text-gray-400">Dados do veículo indisponíveis.</p>
          )}
        </div>
      </div>

      {confirmModal && (
        <Modal title="Criar Vistoria" onClose={() => setConfirmModal(false)}>
          <p className="text-gray-600 dark:text-gray-300 mb-2">
            Deseja criar uma vistoria para a proposta <strong>{proposta.sessaoProposta}</strong>?
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mb-6">
            A data e hora de solicitação serão registradas automaticamente.
          </p>
          {error && <p className="text-sm text-red-600 bg-red-50 rounded px-3 py-2 mb-4">{error}</p>}
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={() => setConfirmModal(false)} className="px-4 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-gray-200">Cancelar</button>
            <button onClick={handleCriarVistoria} disabled={submitting} className="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60">
              {submitting ? 'Criando...' : 'Confirmar'}
            </button>
          </div>
        </Modal>
      )}

      {dadosModal && vistoria && (
        <Modal title="Dados da Vistoria" onClose={() => setDadosModal(false)}>
          {error && (
            <p className="text-sm text-red-600 bg-red-50 rounded px-3 py-2 mb-4">{error}</p>
          )}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 mb-6">
            <InfoRow label="ID" value={`#${vistoria.id_vistoria}`} />
            <InfoRow label="Proposta" value={vistoria.sessaoProposta} />
            <InfoRow label="Status" value={vistoria.status} />
            <InfoRow label="Data de Solicitação" value={new Date(vistoria.dataSolicitacao).toLocaleString('pt-BR')} />
            <InfoRow label="Data de Início" value={vistoria.dataInicio ? new Date(vistoria.dataInicio).toLocaleDateString('pt-BR') : '—'} />
            <InfoRow label="Data de Conclusão" value={vistoria.dataConclusao ? new Date(vistoria.dataConclusao).toLocaleDateString('pt-BR') : '—'} />
          </div>
          {vistoria.status === 'Concluida' || vistoria.status === 'Aprovada' ? (
            <div className="flex justify-end">
              <button onClick={() => setDadosModal(false)} className="px-4 py-2 text-sm rounded-lg border border-gray-300 hover:bg-gray-50">Fechar</button>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-2">
              <button
                onClick={handleCancelarVistoria}
                disabled={cancelando}
                className="px-4 py-2 text-sm rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-60"
              >
                {cancelando ? 'Cancelando...' : 'Cancelar Vistoria'}
              </button>
              <div className="flex gap-2 ml-auto">
                <button
                  onClick={() => { setDadosModal(false); navigate(`/vistorias?open=${vistoria.id_vistoria}`); }}
                  className="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                >
                  Abrir Vistoria
                </button>
                <button onClick={() => setDadosModal(false)} className="px-4 py-2 text-sm rounded-lg border border-gray-300 hover:bg-gray-50">Fechar</button>
              </div>
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}
