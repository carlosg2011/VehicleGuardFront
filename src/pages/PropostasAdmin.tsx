import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ChevronRight, AlertCircle, Loader2, Pencil, X } from 'lucide-react';
import { buscarPropostas } from '../api/propostas';
import { getVeiculo, updateVeiculo } from '../api/veiculos';
import type { PropostaCompleta, PagedResult, StatusProposta, StatusVeiculo, Veiculo } from '../types';
import Pagination from '../components/Pagination';
import StatusBadge from '../components/StatusBadge';

interface Filtros {
  nome: string;
  placa: string;
  renavam: string;
  chassi: string;
  statusVeiculo: StatusVeiculo | '';
  statusProposta: StatusProposta | '';
}

interface FormVeiculo {
  placa: string;
  marca: string;
  modelo: string;
  anoFab: number;
  anoMod: number;
  chassi: string;
  renavam: string;
  cor: string;
  status: StatusVeiculo;
}

const inputCls =
  'border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition bg-white';

const selectCls = inputCls;

const modalInputCls =
  'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition bg-white';

export default function PropostasAdmin() {
  const navigate = useNavigate();
  const [result, setResult] = useState<PagedResult<PropostaCompleta> | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [filtros, setFiltros] = useState<Filtros>({
    nome: '',
    placa: '',
    renavam: '',
    chassi: '',
    statusVeiculo: '',
    statusProposta: '',
  });
  const [aplicados, setAplicados] = useState<Filtros>(filtros);

  const [veiculoEditando, setVeiculoEditando] = useState<Veiculo | null>(null);
  const [form, setForm] = useState<FormVeiculo | null>(null);
  const [loadingModal, setLoadingModal] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erroModal, setErroModal] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setErro(null);
    try {
      const data = await buscarPropostas(page, 10, aplicados);
      setResult(data);
    } catch {
      setErro('Não foi possível carregar as propostas. Verifique se o servidor está rodando.');
      setResult(null);
    } finally {
      setLoading(false);
    }
  }, [page, aplicados]);

  useEffect(() => { load(); }, [load]);

  function handleBuscar(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    setAplicados({ ...filtros });
  }

  function handleLimpar() {
    const vazio: Filtros = { nome: '', placa: '', renavam: '', chassi: '', statusVeiculo: '', statusProposta: '' };
    setFiltros(vazio);
    setAplicados(vazio);
    setPage(1);
  }

  async function handleAbrirEdicao(e: React.MouseEvent, id_veiculo: number) {
    e.stopPropagation();
    setLoadingModal(true);
    setErroModal(null);
    setVeiculoEditando(null);
    setForm(null);
    try {
      const v = await getVeiculo(id_veiculo);
      setVeiculoEditando(v);
      setForm({
        placa: v.placa,
        marca: v.marca,
        modelo: v.modelo,
        anoFab: v.anoFab,
        anoMod: v.anoMod,
        chassi: v.chassi,
        renavam: v.renavam,
        cor: v.cor,
        status: v.status,
      });
    } catch {
      setErroModal('Não foi possível carregar os dados do veículo.');
    } finally {
      setLoadingModal(false);
    }
  }

  function handleFecharModal() {
    setVeiculoEditando(null);
    setForm(null);
    setErroModal(null);
  }

  async function handleSalvar(e: React.FormEvent) {
    e.preventDefault();
    if (!veiculoEditando || !form) return;
    setSalvando(true);
    setErroModal(null);
    try {
      await updateVeiculo(veiculoEditando.id_veiculo, form);
      handleFecharModal();
      load();
    } catch {
      setErroModal('Erro ao salvar. Verifique os dados e tente novamente.');
    } finally {
      setSalvando(false);
    }
  }

  const modalAberto = veiculoEditando !== null || loadingModal;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Consulta de Propostas</h1>
        <p className="text-sm text-gray-500 mt-0.5">Todas as propostas de todos os usuários</p>
      </div>

      <form
        onSubmit={handleBuscar}
        className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-4"
      >
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <input
            className={inputCls}
            placeholder="Nome do proprietário"
            value={filtros.nome}
            onChange={(e) => setFiltros((f) => ({ ...f, nome: e.target.value }))}
          />
          <input
            className={inputCls}
            placeholder="Placa"
            value={filtros.placa}
            onChange={(e) => setFiltros((f) => ({ ...f, placa: e.target.value.toUpperCase() }))}
          />
          <input
            className={inputCls}
            placeholder="RENAVAM"
            value={filtros.renavam}
            onChange={(e) => setFiltros((f) => ({ ...f, renavam: e.target.value }))}
          />
          <input
            className={inputCls}
            placeholder="Chassi"
            value={filtros.chassi}
            onChange={(e) => setFiltros((f) => ({ ...f, chassi: e.target.value.toUpperCase() }))}
          />
          <select
            className={selectCls}
            value={filtros.statusVeiculo}
            onChange={(e) => setFiltros((f) => ({ ...f, statusVeiculo: e.target.value as StatusVeiculo | '' }))}
          >
            <option value="">Status veículo</option>
            <option value="Ativo">Ativo</option>
            <option value="Inativo">Inativo</option>
            <option value="Bloqueado">Bloqueado</option>
          </select>
          <select
            className={selectCls}
            value={filtros.statusProposta}
            onChange={(e) => setFiltros((f) => ({ ...f, statusProposta: e.target.value as StatusProposta | '' }))}
          >
            <option value="">Status proposta</option>
            <option value="Pendente">Pendente</option>
            <option value="EmAnalise">Em Análise</option>
            <option value="Aprovada">Aprovada</option>
            <option value="Recusada">Recusada</option>
            <option value="Cancelada">Cancelada</option>
          </select>
        </div>
        <div className="flex gap-2 mt-3 justify-end">
          <button
            type="button"
            onClick={handleLimpar}
            className="px-4 py-2 text-sm rounded-lg border border-gray-300 hover:bg-gray-50"
          >
            Limpar
          </button>
          <button
            type="submit"
            className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700"
          >
            <Search size={15} /> Buscar
          </button>
        </div>
      </form>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {erro && (
          <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border-b border-red-100 text-red-600 text-sm">
            <AlertCircle size={15} />
            {erro}
          </div>
        )}
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[800px]">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Usuário</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Proprietário</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Placa</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Modelo</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Chassi</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">RENAVAM</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Veículo</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Proposta</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Criação</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={10} className="text-center py-8 text-gray-400">
                    <Loader2 size={18} className="inline animate-spin mr-2" />
                    Carregando...
                  </td>
                </tr>
              )}
              {!loading && result?.items.map((p) => (
                <tr
                  key={p.id_proposta}
                  onClick={() => navigate(`/propostas/${p.id_proposta}`)}
                  className="border-b border-gray-50 hover:bg-blue-50 cursor-pointer"
                >
                  <td className="px-4 py-3 text-gray-700">{p.nomeUsuario}</td>
                  <td className="px-4 py-3 text-gray-700">{p.nomeProprietario}</td>
                  <td className="px-4 py-3 font-mono text-gray-900">{p.placa}</td>
                  <td className="px-4 py-3 text-gray-700">{p.marca} {p.modelo}</td>
                  <td className="px-4 py-3 font-mono text-gray-600 text-xs">{p.chassi || '—'}</td>
                  <td className="px-4 py-3 font-mono text-gray-600">{p.renavam || '—'}</td>
                  <td className="px-4 py-3"><StatusBadge status={p.statusVeiculo} /></td>
                  <td className="px-4 py-3"><StatusBadge status={p.statusProposta} /></td>
                  <td className="px-4 py-3 text-gray-500">{new Date(p.dataCriacao).toLocaleDateString('pt-BR')}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 justify-end">
                      <button
                        onClick={(e) => handleAbrirEdicao(e, p.id_veiculo)}
                        title="Editar veículo"
                        className="p-1.5 rounded-md text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                      >
                        <Pencil size={14} />
                      </button>
                      <ChevronRight size={15} className="text-gray-300" />
                    </div>
                  </td>
                </tr>
              ))}
              {!loading && !erro && result?.items.length === 0 && (
                <tr>
                  <td colSpan={10} className="text-center py-8 text-gray-400">
                    Nenhuma proposta encontrada.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {result && (
        <Pagination page={page} totalPages={result.totalPages} onPageChange={setPage} />
      )}

      {modalAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-base font-semibold text-gray-900">Editar Veículo</h2>
              <button
                onClick={handleFecharModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {loadingModal && (
              <div className="flex items-center justify-center py-12 text-gray-400">
                <Loader2 size={20} className="animate-spin mr-2" />
                Carregando...
              </div>
            )}

            {!loadingModal && form && (
              <form onSubmit={handleSalvar}>
                <div className="px-6 py-4 space-y-4">
                  {erroModal && (
                    <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                      <AlertCircle size={14} />
                      {erroModal}
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Placa</label>
                      <input
                        className={modalInputCls}
                        value={form.placa}
                        maxLength={10}
                        onChange={(e) => setForm((f) => f && ({ ...f, placa: e.target.value.toUpperCase() }))}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
                      <select
                        className={modalInputCls}
                        value={form.status}
                        onChange={(e) => setForm((f) => f && ({ ...f, status: e.target.value as StatusVeiculo }))}
                        required
                      >
                        <option value="Ativo">Ativo</option>
                        <option value="Inativo">Inativo</option>
                        <option value="Bloqueado">Bloqueado</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Marca</label>
                      <input
                        className={modalInputCls}
                        value={form.marca}
                        maxLength={50}
                        onChange={(e) => setForm((f) => f && ({ ...f, marca: e.target.value }))}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Modelo</label>
                      <input
                        className={modalInputCls}
                        value={form.modelo}
                        maxLength={50}
                        onChange={(e) => setForm((f) => f && ({ ...f, modelo: e.target.value }))}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Ano Fabricação</label>
                      <input
                        type="number"
                        className={modalInputCls}
                        value={form.anoFab}
                        min={1900}
                        max={2100}
                        onChange={(e) => setForm((f) => f && ({ ...f, anoFab: Number(e.target.value) }))}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Ano Modelo</label>
                      <input
                        type="number"
                        className={modalInputCls}
                        value={form.anoMod}
                        min={1900}
                        max={2100}
                        onChange={(e) => setForm((f) => f && ({ ...f, anoMod: Number(e.target.value) }))}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Chassi</label>
                    <input
                      className={modalInputCls}
                      value={form.chassi}
                      maxLength={17}
                      onChange={(e) => setForm((f) => f && ({ ...f, chassi: e.target.value.toUpperCase() }))}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">RENAVAM</label>
                      <input
                        className={modalInputCls}
                        value={form.renavam}
                        maxLength={11}
                        onChange={(e) => setForm((f) => f && ({ ...f, renavam: e.target.value }))}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Cor</label>
                      <input
                        className={modalInputCls}
                        value={form.cor}
                        maxLength={20}
                        onChange={(e) => setForm((f) => f && ({ ...f, cor: e.target.value }))}
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 justify-end px-6 py-4 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={handleFecharModal}
                    className="px-4 py-2 text-sm rounded-lg border border-gray-300 hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={salvando}
                    className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
                  >
                    {salvando && <Loader2 size={14} className="animate-spin" />}
                    Salvar
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
