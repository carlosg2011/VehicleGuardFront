import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, FileSignature, PenLine, XCircle } from 'lucide-react';
import { getTermo, updateTermo } from '../api/termos';
import { getProposta } from '../api/propostas';
import { getProprietario } from '../api/proprietarios';
import { getVeiculo } from '../api/veiculos';
import { getVistorias } from '../api/vistorias';
import type { Termo, Proposta, Proprietario, Veiculo, Vistoria } from '../types';
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

function SignatureCard({ title, name, signed, date }: { title: string; name: string; signed: boolean; date?: string }) {
  return (
    <div className={`rounded-xl border-2 p-4 transition ${signed ? 'border-green-200 bg-green-50' : 'border-yellow-200 bg-yellow-50'}`}>
      <p className="text-xs text-gray-500 mb-1">{title}</p>
      <p className="text-sm font-semibold text-gray-900 mb-2">{name}</p>
      <StatusBadge status={signed ? 'Assinado' : 'Pendente'} />
      {signed && date && <p className="text-xs text-gray-500 mt-1.5">Assinado em {date}</p>}
    </div>
  );
}

export default function TermoDetalhe() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [termo, setTermo] = useState<Termo | null>(null);
  const [proposta, setProposta] = useState<Proposta | null>(null);
  const [proprietario, setProprietario] = useState<Proprietario | null>(null);
  const [veiculo, setVeiculo] = useState<Veiculo | null>(null);
  const [vistoria, setVistoria] = useState<Vistoria | null>(null);
  const [loading, setLoading] = useState(true);
  const [gerado, setGerado] = useState(false);
  const [assinando, setAssinando] = useState(false);
  const [cancelando, setCancelando] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    (async () => {
      setLoading(true);
      try {
        const t = await getTermo(Number(id));
        setTermo(t);
        const p = await getProposta(t.id_proposta);
        setProposta(p);
        const [prop, veic, vistorias] = await Promise.all([
          getProprietario(p.id_proprietario),
          getVeiculo(p.id_veiculo),
          getVistorias(1, 10, undefined, p.id_proposta, true),
        ]);
        setProprietario(prop);
        setVeiculo(veic);
        setVistoria(vistorias.items.find(v => v.status !== 'Cancelada') ?? null);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  async function handleAssinar() {
    if (!termo) return;
    setAssinando(true);
    setError('');
    try {
      const atualizado = await updateTermo(termo.id_termo, {
        numeroTermo: termo.numeroTermo,
        status: 'Assinado',
        dataEnvio: termo.dataEnvio,
        dataAssinatura: new Date().toISOString(),
        id_proposta: termo.id_proposta,
      });
      setTermo(atualizado);
    } catch {
      setError('Erro ao assinar termo. Tente novamente.');
    } finally {
      setAssinando(false);
    }
  }

  async function handleCancelar() {
    if (!termo) return;
    setCancelando(true);
    setError('');
    try {
      await updateTermo(termo.id_termo, {
        numeroTermo: termo.numeroTermo,
        status: 'Cancelado',
        dataEnvio: termo.dataEnvio,
        dataAssinatura: termo.dataAssinatura,
        id_proposta: termo.id_proposta,
      });
      navigate('/termos');
    } catch {
      setError('Erro ao cancelar termo. Tente novamente.');
    } finally {
      setCancelando(false);
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-48 text-gray-400 text-sm">Carregando...</div>;
  }

  if (!termo) {
    return (
      <div className="text-center py-16 text-gray-400">
        <p>Termo não encontrado.</p>
        <button onClick={() => navigate('/termos')} className="mt-4 text-blue-600 hover:underline text-sm">Voltar</button>
      </div>
    );
  }

  const jaAssinado = termo.status === 'Assinado';
  const mostrarAssinaturas = gerado || jaAssinado;
  const dataFormatada = termo.dataAssinatura
    ? new Date(termo.dataAssinatura).toLocaleDateString('pt-BR')
    : new Date().toLocaleDateString('pt-BR');

  return (
    <div className="max-w-3xl">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-6">
        <button
          onClick={() => navigate('/termos')}
          className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white transition"
        >
          <ArrowLeft size={16} />
          Voltar
        </button>
        {!mostrarAssinaturas && termo.status === 'Ativo' && (
          <button
            onClick={() => setGerado(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
          >
            <FileSignature size={16} />
            Gerar Termo de Adesão
          </button>
        )}
      </div>

      <div className="mb-4">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white font-mono">{termo.numeroTermo}</h1>
          <StatusBadge status={termo.status} />
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Enviado em {new Date(termo.dataEnvio).toLocaleDateString('pt-BR')}
          {termo.dataAssinatura && ` · Assinado em ${new Date(termo.dataAssinatura).toLocaleDateString('pt-BR')}`}
        </p>
      </div>

      <div className="space-y-4">
        {proposta && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-5">
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 uppercase tracking-wide">Proposta</h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <InfoRow label="Código" value={proposta.sessaoProposta} />
              <InfoRow label="Status" value={proposta.status} />
              <InfoRow label="Criação" value={new Date(proposta.dataCriacao).toLocaleDateString('pt-BR')} />
            </div>
          </div>
        )}

        {proprietario && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-5">
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 uppercase tracking-wide">Proprietário</h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <InfoRow label="Nome" value={proprietario.nome} />
              <InfoRow label="CPF / CNPJ" value={proprietario.cpf} />
              <InfoRow label="Telefone" value={proprietario.telefone} />
              <InfoRow label="Email" value={proprietario.email} />
            </div>
          </div>
        )}

        {veiculo && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-5">
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 uppercase tracking-wide">Veículo</h2>
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
          </div>
        )}

        {vistoria && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-5">
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 uppercase tracking-wide">Vistoria</h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <InfoRow label="ID" value={`#${vistoria.id_vistoria}`} />
              <InfoRow label="Status" value={vistoria.status} />
              <InfoRow label="Solicitação" value={new Date(vistoria.dataSolicitacao).toLocaleDateString('pt-BR')} />
              <InfoRow label="Início" value={vistoria.dataInicio ? new Date(vistoria.dataInicio).toLocaleDateString('pt-BR') : null} />
              <InfoRow label="Conclusão" value={vistoria.dataConclusao ? new Date(vistoria.dataConclusao).toLocaleDateString('pt-BR') : null} />
            </div>
          </div>
        )}

        {mostrarAssinaturas && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-5">
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 uppercase tracking-wide">Assinaturas</h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <SignatureCard
                title="Proprietário"
                name={proprietario?.nome ?? '—'}
                signed={true}
                date={dataFormatada}
              />
              <SignatureCard
                title="Consultor"
                name={user?.nome ?? '—'}
                signed={jaAssinado}
                date={jaAssinado ? dataFormatada : undefined}
              />
            </div>
          </div>
        )}
      </div>

      {error && <p className="text-sm text-red-600 bg-red-50 rounded px-3 py-2 mt-4">{error}</p>}

      {mostrarAssinaturas && !jaAssinado && (
        <div className="flex gap-2 justify-end mt-4">
          <button
            onClick={handleCancelar}
            disabled={cancelando}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition disabled:opacity-60"
          >
            <XCircle size={16} />
            {cancelando ? 'Cancelando...' : 'Cancelar Termo'}
          </button>
          <button
            onClick={handleAssinar}
            disabled={assinando}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition disabled:opacity-60"
          >
            <PenLine size={16} />
            {assinando ? 'Assinando...' : 'Realizar Assinatura'}
          </button>
        </div>
      )}
    </div>
  );
}
