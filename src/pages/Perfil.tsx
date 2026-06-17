import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { User, Lock, CheckCircle, Moon, Sun } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { updatePerfil, changePassword } from '../api/usuarios';

const inputCls =
  'w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 transition';

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>
      {children}
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  );
}

interface ProfileForm {
  nome: string;
  email: string;
}

interface PasswordForm {
  senhaAtual: string;
  novaSenha: string;
  confirmarSenha: string;
}

export default function Perfil() {
  const { user, signIn } = useAuth();
  const { darkMode, toggleDarkMode } = useTheme();
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  const profileForm = useForm<ProfileForm>({
    defaultValues: { nome: user?.nome ?? '', email: user?.email ?? '' },
  });

  const passwordForm = useForm<PasswordForm>({
    defaultValues: { senhaAtual: '', novaSenha: '', confirmarSenha: '' },
  });

  async function onProfileSubmit(data: ProfileForm) {
    setProfileError('');
    setProfileSuccess(false);
    try {
      const result = await updatePerfil(data);
      signIn(result.token);
      setProfileSuccess(true);
      setTimeout(() => setProfileSuccess(false), 3000);
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setProfileError(msg ?? 'Erro ao atualizar perfil.');
    }
  }

  async function onPasswordSubmit(data: PasswordForm) {
    setPasswordError('');
    setPasswordSuccess(false);
    if (data.novaSenha !== data.confirmarSenha) {
      setPasswordError('As senhas não coincidem.');
      return;
    }
    try {
      await changePassword({ senhaAtual: data.senhaAtual, novaSenha: data.novaSenha });
      setPasswordSuccess(true);
      passwordForm.reset();
      setTimeout(() => setPasswordSuccess(false), 3000);
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setPasswordError(msg ?? 'Erro ao alterar senha.');
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-xl font-bold text-gray-900 dark:text-white">Meu Perfil</h1>

      {/* Dados pessoais */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
        <div className="flex items-center gap-2 mb-5">
          <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
            <User size={16} className="text-blue-600 dark:text-blue-400" />
          </div>
          <h2 className="text-base font-semibold text-gray-800 dark:text-gray-100">Dados Pessoais</h2>
        </div>

        <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
          <Field label="Nome" error={profileForm.formState.errors.nome?.message}>
            <input
              {...profileForm.register('nome', { required: 'Obrigatório' })}
              className={inputCls}
              placeholder="Seu nome"
            />
          </Field>

          <Field label="Email" error={profileForm.formState.errors.email?.message}>
            <input
              type="email"
              {...profileForm.register('email', { required: 'Obrigatório' })}
              className={inputCls}
              placeholder="seu@email.com"
            />
          </Field>

          {profileError && (
            <p className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2">{profileError}</p>
          )}

          {profileSuccess && (
            <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20 rounded-lg px-3 py-2">
              <CheckCircle size={16} />
              Perfil atualizado com sucesso!
            </div>
          )}

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={profileForm.formState.isSubmitting}
              className="px-5 py-2 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60 transition-colors"
            >
              {profileForm.formState.isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </div>
        </form>
      </div>

      {/* Alterar senha */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
        <div className="flex items-center gap-2 mb-5">
          <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
            <Lock size={16} className="text-blue-600 dark:text-blue-400" />
          </div>
          <h2 className="text-base font-semibold text-gray-800 dark:text-gray-100">Alterar Senha</h2>
        </div>

        <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
          <Field label="Senha atual" error={passwordForm.formState.errors.senhaAtual?.message}>
            <input
              type="password"
              {...passwordForm.register('senhaAtual', { required: 'Obrigatório' })}
              className={inputCls}
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </Field>

          <Field label="Nova senha" error={passwordForm.formState.errors.novaSenha?.message}>
            <input
              type="password"
              {...passwordForm.register('novaSenha', {
                required: 'Obrigatório',
                minLength: { value: 8, message: 'Mínimo 8 caracteres' },
              })}
              className={inputCls}
              placeholder="••••••••"
              autoComplete="new-password"
            />
          </Field>

          <Field label="Confirmar nova senha" error={passwordForm.formState.errors.confirmarSenha?.message}>
            <input
              type="password"
              {...passwordForm.register('confirmarSenha', { required: 'Obrigatório' })}
              className={inputCls}
              placeholder="••••••••"
              autoComplete="new-password"
            />
          </Field>

          {passwordError && (
            <p className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2">{passwordError}</p>
          )}

          {passwordSuccess && (
            <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20 rounded-lg px-3 py-2">
              <CheckCircle size={16} />
              Senha alterada com sucesso!
            </div>
          )}

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={passwordForm.formState.isSubmitting}
              className="px-5 py-2 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60 transition-colors"
            >
              {passwordForm.formState.isSubmitting ? 'Alterando...' : 'Alterar Senha'}
            </button>
          </div>
        </form>
      </div>

      {/* Aparência */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
        <div className="flex items-center gap-2 mb-5">
          <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
            {darkMode ? (
              <Moon size={16} className="text-blue-600 dark:text-blue-400" />
            ) : (
              <Sun size={16} className="text-blue-600 dark:text-blue-400" />
            )}
          </div>
          <h2 className="text-base font-semibold text-gray-800 dark:text-gray-100">Aparência</h2>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-200">Modo Escuro</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Altera o tema do sistema para escuro</p>
          </div>
          <button
            type="button"
            onClick={toggleDarkMode}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
              darkMode ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                darkMode ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>
    </div>
  );
}
