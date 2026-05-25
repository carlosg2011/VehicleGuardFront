import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { login } from '../api/auth';
import { ShieldCheck, Eye, EyeOff } from 'lucide-react';
import Modal from '../components/Modal';

export default function Login() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [forgotModal, setForgotModal] = useState(false);
  const [showSenha, setShowSenha] = useState(false);

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
            <Modal title="Recuperação de senha" onClose={() => setForgotModal(false)}>
              <p className="text-gray-600 text-sm mb-4">
                Entre em contato com o administrador do sistema para redefinir sua senha.
              </p>
              <div className="flex justify-end">
                <button
                  onClick={() => setForgotModal(false)}
                  className="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                >
                  Entendido
                </button>
              </div>
            </Modal>
          )}
        </div>
      </div>
    </div>
  );
}
