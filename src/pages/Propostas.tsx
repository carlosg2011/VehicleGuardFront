import { useEffect, useState } from 'react';
import { Plus, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getPropostas, createProposta } from '../api/propostas';
import { createProprietario, getProprietario, getProprietarioByCpf } from '../api/proprietarios';
import { createVeiculo, getVeiculo } from '../api/veiculos';
import type { Proposta, Proprietario, Veiculo, PagedResult, StatusProposta } from '../types';
import Modal from '../components/Modal';
import Pagination from '../components/Pagination';
import StatusBadge from '../components/StatusBadge';
import MaskedInput, { Masks } from '../components/MaskedInput';
import FipeCombobox, { type ComboOption } from '../components/FipeCombobox';
import { useForm } from 'react-hook-form';
import { useAuth } from '../contexts/AuthContext';
import { validateCpfCnpj } from '../utils/validators';
import { getMarcas, getModelos, getAnos, type FipeTipo } from '../api/fipe';

interface CreateForm {
  sessaoProposta: string;
  propStatus: StatusProposta;
  propNome: string;
  propCpf: string;
  propTelefone: string;
  propEmail: string;
  veicPlaca: string;
  veicMarca: string;
  veicModelo: string;
  veicAnoFab: number;
  veicAnoMod: number;
  veicChassi: string;
  veicRenavam: string;
  veicCor: string;
}

const inputCls =
  'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition';

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {children}
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="border-b border-gray-200 pb-1 mb-3">
      <h3 className="text-sm font-semibold text-gray-800 uppercase tracking-wide">{children}</h3>
    </div>
  );
}

function generateCode() {
  const year = new Date().getFullYear();
  const rand = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `PROP-${year}-${rand}`;
}

const TIPOS: { value: FipeTipo; label: string }[] = [
  { value: 'carros', label: 'Carros' },
  { value: 'motos', label: 'Motos' },
  { value: 'caminhoes', label: 'Caminhões' },
];

export default function Propostas() {
  const navigate = useNavigate();
  const [result, setResult] = useState<PagedResult<Proposta> | null>(null);
  const [page, setPage] = useState(1);
  const [proprietarioMap, setProprietarioMap] = useState<Record<number, Proprietario>>({});
  const [veiculoMap, setVeiculoMap] = useState<Record<number, Veiculo>>({});
  const [createModal, setCreateModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const { user } = useAuth();
  const createForm = useForm<CreateForm>();
  const { control } = createForm;

  const [fipeTipo, setFipeTipo] = useState<FipeTipo>('carros');
  const [marcas, setMarcas] = useState<ComboOption[]>([]);
  const [modelos, setModelos] = useState<ComboOption[]>([]);
  const [anos, setAnos] = useState<ComboOption[]>([]);
  const [loadingMarcas, setLoadingMarcas] = useState(false);
  const [loadingModelos, setLoadingModelos] = useState(false);
  const [loadingAnos, setLoadingAnos] = useState(false);
  const [selectedMarcaNome, setSelectedMarcaNome] = useState('');
  const [selectedMarcaCode, setSelectedMarcaCode] = useState('');
  const [selectedModeloNome, setSelectedModeloNome] = useState('');
  const [selectedAno, setSelectedAno] = useState('');

  async function load() {
    setLoading(true);
    try {
      const data = await getPropostas(page, 10, user?.id);
      setResult(data);

      const propIds = [...new Set(data.items.map((p) => p.id_proprietario))];
      const veicIds = [...new Set(data.items.map((p) => p.id_veiculo))];

      const [props, veics] = await Promise.all([
        Promise.all(propIds.map((id) => getProprietario(id).catch(() => null))),
        Promise.all(veicIds.map((id) => getVeiculo(id).catch(() => null))),
      ]);

      const pm: Record<number, Proprietario> = {};
      props.forEach((p) => { if (p) pm[p.id_proprietario] = p; });
      const vm: Record<number, Veiculo> = {};
      veics.forEach((v) => { if (v) vm[v.id_veiculo] = v; });

      setProprietarioMap(pm);
      setVeiculoMap(vm);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [page]);

  useEffect(() => {
    setLoadingMarcas(true);
    setMarcas([]);
    getMarcas(fipeTipo)
      .then((data) => setMarcas(data.map((m) => ({ value: m.codigo, label: m.nome }))))
      .catch(() => {})
      .finally(() => setLoadingMarcas(false));
  }, [fipeTipo]);

  function resetFipeSelection() {
    setSelectedMarcaNome('');
    setSelectedMarcaCode('');
    setSelectedModeloNome('');
    setSelectedAno('');
    setModelos([]);
    setAnos([]);
  }

  function onTipoChange(tipo: FipeTipo) {
    setFipeTipo(tipo);
    resetFipeSelection();
    createForm.setValue('veicMarca', '');
    createForm.setValue('veicModelo', '');
    createForm.setValue('veicAnoMod', 0);
  }

  async function onMarcaSelect(opt: ComboOption) {
    setSelectedMarcaNome(opt.label);
    setSelectedMarcaCode(opt.value);
    setSelectedModeloNome('');
    setSelectedAno('');
    setModelos([]);
    setAnos([]);
    createForm.setValue('veicMarca', opt.label, { shouldValidate: true });
    createForm.setValue('veicModelo', '');
    createForm.setValue('veicAnoMod', 0);
    setLoadingModelos(true);
    try {
      const res = await getModelos(fipeTipo, opt.value);
      setModelos(res.modelos.map((m) => ({ value: String(m.codigo), label: m.nome })));
    } catch {
    } finally {
      setLoadingModelos(false);
    }
  }

  async function onModeloSelect(opt: ComboOption) {
    setSelectedModeloNome(opt.label);
    setSelectedAno('');
    setAnos([]);
    createForm.setValue('veicModelo', opt.label, { shouldValidate: true });
    createForm.setValue('veicAnoMod', 0);
    setLoadingAnos(true);
    try {
      const res = await getAnos(fipeTipo, selectedMarcaCode, parseInt(opt.value));
      setAnos(res.map((a) => ({ value: a.codigo, label: a.nome })));
    } catch {
    } finally {
      setLoadingAnos(false);
    }
  }

  function onAnoSelect(opt: ComboOption) {
    setSelectedAno(opt.label);
    const year = parseInt(opt.label);
    createForm.setValue('veicAnoMod', year, { shouldValidate: true });
    createForm.setValue('veicAnoFab', year);
  }

  function openCreate() {
    createForm.reset({
      sessaoProposta: generateCode(),
      propStatus: 'Pendente',
      propNome: '', propCpf: '', propTelefone: '', propEmail: '',
      veicPlaca: '', veicMarca: '', veicModelo: '',
      veicAnoFab: new Date().getFullYear(),
      veicAnoMod: 0,
      veicChassi: '', veicRenavam: '', veicCor: '',
    });
    resetFipeSelection();
    setCreateModal(true);
    setError('');
  }

  async function onCreateSubmit(data: CreateForm) {
    setError('');
    try {
      const proprietario = await getProprietarioByCpf(data.propCpf).catch(() => null)
        ?? await createProprietario({ nome: data.propNome, cpf: data.propCpf, telefone: data.propTelefone, email: data.propEmail });
      const veiculo = await createVeiculo({ placa: data.veicPlaca, marca: data.veicMarca, modelo: data.veicModelo, anoFab: Number(data.veicAnoFab), anoMod: Number(data.veicAnoMod), chassi: data.veicChassi, renavam: data.veicRenavam, cor: data.veicCor, status: 'Ativo' });
      await createProposta({ sessaoProposta: data.sessaoProposta, status: data.propStatus, id_usuario: user!.id, id_veiculo: veiculo.id_veiculo, id_proprietario: proprietario.id_proprietario });
      setCreateModal(false);
      load();
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setError(msg ?? 'Erro ao criar proposta.');
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-900">Propostas</h1>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
        >
          <Plus size={16} /> Nova Proposta
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[560px]">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Código</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Proprietário</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Veículo</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Criação</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="text-center py-10 text-gray-400">Carregando...</td></tr>
              ) : result?.items.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-8 text-gray-400">Nenhuma proposta encontrada.</td></tr>
              ) : result?.items.map((p) => (
                <tr
                  key={p.id_proposta}
                  onClick={() => navigate(`/propostas/${p.id_proposta}`)}
                  className="border-b border-gray-50 hover:bg-blue-50 cursor-pointer"
                >
                  <td className="px-4 py-3 font-mono font-medium text-gray-900">{p.sessaoProposta}</td>
                  <td className="px-4 py-3"><StatusBadge status={p.status} /></td>
                  <td className="px-4 py-3 text-gray-700">{proprietarioMap[p.id_proprietario]?.nome ?? `#${p.id_proprietario}`}</td>
                  <td className="px-4 py-3 text-gray-700">
                    {veiculoMap[p.id_veiculo]
                      ? `${veiculoMap[p.id_veiculo].placa} — ${veiculoMap[p.id_veiculo].modelo}`
                      : `#${p.id_veiculo}`}
                  </td>
                  <td className="px-4 py-3 text-gray-500">{new Date(p.dataCriacao).toLocaleDateString('pt-BR')}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end">
                      <ChevronRight size={15} className="text-gray-300 pointer-events-none" />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {result && <Pagination page={page} totalPages={result.totalPages} onPageChange={setPage} />}

      {createModal && (
        <Modal title="Nova Proposta" onClose={() => setCreateModal(false)} size="xl">
          <form onSubmit={createForm.handleSubmit(onCreateSubmit)} className="space-y-5">
            <div>
              <SectionTitle>Proprietário</SectionTitle>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field label="Nome" error={createForm.formState.errors.propNome?.message}>
                  <input {...createForm.register('propNome', { required: 'Obrigatório' })} className={inputCls} placeholder="Nome completo" />
                </Field>
                <Field label="CPF / CNPJ" error={createForm.formState.errors.propCpf?.message}>
                  <MaskedInput control={control} name="propCpf" mask={Masks.cpfCnpj} rules={{ required: 'Obrigatório', validate: validateCpfCnpj }} placeholder="000.000.000-00" />
                </Field>
                <Field label="Telefone">
                  <MaskedInput control={control} name="propTelefone" mask={Masks.telefone} placeholder="(00) 00000-0000" />
                </Field>
                <Field label="Email">
                  <input type="email" {...createForm.register('propEmail')} className={inputCls} placeholder="email@exemplo.com" />
                </Field>
              </div>
            </div>

            <div>
              <SectionTitle>Veículo</SectionTitle>

              <div className="flex gap-2 mb-3">
                {TIPOS.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => onTipoChange(t.value)}
                    className={`px-3 py-1 text-xs rounded-full border font-medium transition ${
                      fipeTipo === t.value
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'text-gray-600 border-gray-300 hover:border-blue-400'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <Field label="Placa" error={createForm.formState.errors.veicPlaca?.message}>
                  <input
                    {...createForm.register('veicPlaca', { required: 'Obrigatório', setValueAs: (v: string) => v.toUpperCase() })}
                    className={inputCls}
                    placeholder="ABC-1234"
                    maxLength={8}
                    onInput={(e) => { (e.target as HTMLInputElement).value = (e.target as HTMLInputElement).value.toUpperCase(); }}
                  />
                </Field>
                <Field label="Marca" error={createForm.formState.errors.veicMarca?.message}>
                  <input type="hidden" {...createForm.register('veicMarca', { required: 'Obrigatório' })} />
                  <FipeCombobox
                    options={marcas}
                    value={selectedMarcaNome}
                    onSelect={onMarcaSelect}
                    loading={loadingMarcas}
                    placeholder="Selecione a marca"
                  />
                </Field>
                <Field label="Modelo" error={createForm.formState.errors.veicModelo?.message}>
                  <input type="hidden" {...createForm.register('veicModelo', { required: 'Obrigatório' })} />
                  <FipeCombobox
                    options={modelos}
                    value={selectedModeloNome}
                    onSelect={onModeloSelect}
                    loading={loadingModelos}
                    disabled={!selectedMarcaNome}
                    placeholder={selectedMarcaNome ? 'Selecione o modelo' : 'Selecione a marca primeiro'}
                  />
                </Field>
                <Field label="Ano Fabricação" error={createForm.formState.errors.veicAnoFab?.message}>
                  <input
                    type="number"
                    {...createForm.register('veicAnoFab', { required: 'Obrigatório', min: { value: 1900, message: 'Inválido' }, valueAsNumber: true })}
                    className={inputCls}
                  />
                </Field>
                <Field label="Ano Modelo" error={createForm.formState.errors.veicAnoMod?.message}>
                  <input type="hidden" {...createForm.register('veicAnoMod', { validate: (v) => v >= 1900 || 'Selecione o ano modelo' })} />
                  <FipeCombobox
                    options={anos}
                    value={selectedAno}
                    onSelect={onAnoSelect}
                    loading={loadingAnos}
                    disabled={!selectedModeloNome}
                    placeholder={selectedModeloNome ? 'Selecione o ano' : 'Selecione o modelo primeiro'}
                  />
                </Field>
                <Field label="Cor">
                  <input {...createForm.register('veicCor')} className={inputCls} placeholder="Prata" />
                </Field>
                <Field label="Chassi">
                  <input
                    {...createForm.register('veicChassi', { setValueAs: (v: string) => v.toUpperCase() })}
                    className={inputCls}
                    placeholder="9BWZZZ377VT004251"
                    maxLength={17}
                    onInput={(e) => { (e.target as HTMLInputElement).value = (e.target as HTMLInputElement).value.toUpperCase(); }}
                  />
                </Field>
                <Field label="Renavam">
                  <MaskedInput control={control} name="veicRenavam" mask={Masks.renavam} placeholder="00123456789" />
                </Field>
              </div>
            </div>

            <input type="hidden" {...createForm.register('sessaoProposta')} />
            <input type="hidden" {...createForm.register('propStatus')} />

            {error && <p className="text-sm text-red-600 bg-red-50 rounded px-3 py-2">{error}</p>}
            <div className="flex gap-2 justify-end pt-2">
              <button type="button" onClick={() => setCreateModal(false)} className="px-4 py-2 text-sm rounded-lg border border-gray-300 hover:bg-gray-50">Cancelar</button>
              <button type="submit" disabled={createForm.formState.isSubmitting} className="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60">
                {createForm.formState.isSubmitting ? 'Salvando...' : 'Criar Proposta'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
