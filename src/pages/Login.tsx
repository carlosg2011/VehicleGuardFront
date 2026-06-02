import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { login, forgotPassword, validateToken, resetPassword } from '../api/auth';
import { ShieldCheck, Eye, EyeOff, CheckCircle } from 'lucide-react';
import Modal from '../components/Modal';

type ForgotStep = 1 | 2 | 3;

const inputCls =
  'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition';

export default function Login() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSenha, setShowSenha] = useState(false);

  // Forgot password state
  const [forgotModal, setForgotModal] = useState(false);
  const [forgotStep, setForgotStep] = useState<ForgotStep>(1);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotCode, setForgotCode] = useState('');
  const [forgotNovaSenha, setForgotNovaSenha] = useState('');
  const [forgotConfirmSenha, setForgotConfirmSenha] = useState('');
  const [forgotShowNova, setForgotShowNova] = useState(false);
  const [forgotShowConfirm, setForgotShowConfirm] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);
  const [forgotError, setForgotError] = useState('');

  function makeDemoToken(): string {
    const encode = (obj: object) =>
      btoa(JSON.stringify(obj)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
    const header = encode({ alg: 'none', typ: 'JWT' });
    const payload = encode({
      sub: '1',
      name: 'Demo Admin',
      email: 'demo@vehicleguard.com',
      'http://schemas.microsoft.com/ws/2008/06/identity/claims/role': 'Admin',
      exp: Math.floor(Date.now() / 1000) + 28800,
    });
    return `${header}.${payload}.demo`;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (email === 'demo@vehicleguard.com' && senha === 'demo123') {
        signIn(makeDemoToken());
        navigate('/');
        return;
      }
      const data = await login(email, senha);
      signIn(data.token);
      navigate('/');
    } catch {
      setError('Email ou senha inválidos.');
    } finally {
      setLoading(false);
    }
  }

  function closeForgot() {
    setForgotModal(false);
    setForgotStep(1);
    setForgotEmail('');
    setForgotCode('');
    setForgotNovaSenha('');
    setForgotConfirmSenha('');
    setForgotLoading(false);
    setForgotSent(false);
    setForgotError('');
  }

  async function handleForgotEmail(e: React.FormEvent) {
    e.preventDefault();
    setForgotError('');
    setForgotLoading(true);
    try {
      await forgotPassword(forgotEmail);
      setForgotStep(2);
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 404) {
        setForgotError('E-mail não encontrado. Verifique e tente novamente.');
      } else {
        setForgotError('Erro ao enviar o código. Tente novamente.');
      }
    } finally {
      setForgotLoading(false);
    }
  }

  async function handleForgotCode(e: React.FormEvent) {
    e.preventDefault();
    setForgotError('');
    if (forgotCode.length !== 6) {
      setForgotError('Digite o código de 6 dígitos.');
      return;
    }
    setForgotLoading(true);
    try {
      await validateToken(forgotCode);
      setForgotStep(3);
    } catch {
      setForgotError('Código inválido ou expirado.');
    } finally {
      setForgotLoading(false);
    }
  }

  async function handleForgotReset(e: React.FormEvent) {
    e.preventDefault();
    setForgotError('');
    if (forgotNovaSenha !== forgotConfirmSenha) {
      setForgotError('As senhas não coincidem.');
      return;
    }
    if (forgotNovaSenha.length < 6) {
      setForgotError('A senha deve ter ao menos 6 caracteres.');
      return;
    }
    setForgotLoading(true);
    try {
      await resetPassword(forgotCode, forgotNovaSenha);
      setForgotSent(true);
    } catch {
      setForgotError('Erro ao redefinir a senha. Solicite um novo código.');
    } finally {
      setForgotLoading(false);
    }
  }

  const stepLabel: Record<ForgotStep, string> = {
    1: 'Recuperação de senha',
    2: 'Insira o código',
    3: 'Nova senha',
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="flex flex-col items-center mb-8">
            <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center mb-3">
              <ShieldCheck size={28} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Vehicle Guard</h1>
            <p className="text-sm text-gray-500 mt-1">Faça login para continuar</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(''); }}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
                placeholder="seu@email.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Senha</label>
              <div className="relative">
                <input
                  type={showSenha ? 'text' : 'password'}
                  value={senha}
                  onChange={(e) => { setSenha(e.target.value); setError(''); }}
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 pr-10 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowSenha((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                >
                  {showSenha ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg transition disabled:opacity-60"
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>

            <button
              type="button"
              onClick={() => setForgotModal(true)}
              className="w-full text-sm text-blue-600 hover:text-blue-700 hover:underline mt-1 text-center"
            >
              Esqueci minha senha
            </button>
          </form>

          {forgotModal && (
            <Modal title={forgotSent ? 'Senha redefinida' : stepLabel[forgotStep]} onClose={closeForgot}>
              {forgotSent ? (
                <div className="text-center space-y-4 py-2">
                  <CheckCircle size={48} className="text-green-500 mx-auto" />
                  <p className="text-gray-700 font-medium">Senha redefinida com sucesso!</p>
                  <button
                    onClick={closeForgot}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg transition text-sm"
                  >
                    Fechar
                  </button>
                </div>
              ) : forgotStep === 1 ? (
                <form onSubmit={handleForgotEmail} className="space-y-4">
                  <p className="text-gray-600 text-sm">
                    Informe seu e-mail e enviaremos um código de 6 dígitos para redefinir sua senha.
                  </p>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
                    <input
                      type="email"
                      value={forgotEmail}
                      onChange={(e) => { setForgotEmail(e.target.value); setForgotError(''); }}
                      required
                      autoFocus
                      className={inputCls}
                      placeholder="seu@email.com"
                    />
                  </div>
                  {forgotError && (
                    <p className="text-sm text-red-600 bg-red-50 rounded px-3 py-2">{forgotError}</p>
                  )}
                  <div className="flex gap-2 justify-end">
                    <button type="button" onClick={closeForgot}
                      className="px-4 py-2 text-sm rounded-lg border border-gray-300 hover:bg-gray-50">
                      Cancelar
                    </button>
                    <button type="submit" disabled={forgotLoading}
                      className="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60">
                      {forgotLoading ? 'Enviando...' : 'Enviar código'}
                    </button>
                  </div>
                </form>
              ) : forgotStep === 2 ? (
                <form onSubmit={handleForgotCode} className="space-y-4">
                  <p className="text-gray-600 text-sm">
                    Enviamos um código de 6 dígitos para <strong>{forgotEmail}</strong>. Verifique sua caixa de entrada.
                  </p>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Código</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      value={forgotCode}
                      onChange={(e) => { setForgotCode(e.target.value.replace(/\D/g, '')); setForgotError(''); }}
                      required
                      autoFocus
                      className={inputCls + ' text-center text-xl tracking-widest font-mono'}
                      placeholder="000000"
                    />
                  </div>
                  {forgotError && (
                    <p className="text-sm text-red-600 bg-red-50 rounded px-3 py-2">{forgotError}</p>
                  )}
                  <div className="flex gap-2 justify-end">
                    <button type="button" onClick={() => { setForgotStep(1); setForgotCode(''); setForgotError(''); }}
                      className="px-4 py-2 text-sm rounded-lg border border-gray-300 hover:bg-gray-50">
                      Voltar
                    </button>
                    <button type="submit" disabled={forgotLoading}
                      className="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60">
                      {forgotLoading ? 'Validando...' : 'Validar código'}
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleForgotReset} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nova senha</label>
                    <div className="relative">
                      <input
                        type={forgotShowNova ? 'text' : 'password'}
                        value={forgotNovaSenha}
                        onChange={(e) => { setForgotNovaSenha(e.target.value); setForgotError(''); }}
                        required
                        autoFocus
                        className={inputCls + ' pr-10'}
                        placeholder="Mínimo 6 caracteres"
                      />
                      <button type="button" onClick={() => setForgotShowNova((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition">
                        {forgotShowNova ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Confirmar senha</label>
                    <div className="relative">
                      <input
                        type={forgotShowConfirm ? 'text' : 'password'}
                        value={forgotConfirmSenha}
                        onChange={(e) => { setForgotConfirmSenha(e.target.value); setForgotError(''); }}
                        required
                        className={inputCls + ' pr-10'}
                        placeholder="Repita a nova senha"
                      />
                      <button type="button" onClick={() => setForgotShowConfirm((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition">
                        {forgotShowConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                  {forgotError && (
                    <p className="text-sm text-red-600 bg-red-50 rounded px-3 py-2">{forgotError}</p>
                  )}
                  <button
                    type="submit"
                    disabled={forgotLoading}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg transition disabled:opacity-60 text-sm"
                  >
                    {forgotLoading ? 'Salvando...' : 'Redefinir senha'}
                  </button>
                </form>
              )}
            </Modal>
          )}
        </div>
      </div>
    </div>
  );
}
