import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { User, Lock, CheckCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { updatePerfil, changePassword } from '../api/usuarios';

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
      <h1 className="text-xl font-bold text-gray-900">Meu Perfil</h1>

      {/* Dados pessoais */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center gap-2 mb-5">
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
            <User size={16} className="text-blue-600" />
          </div>
          <h2 className="text-base font-semibold text-gray-800">Dados Pessoais</h2>
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
            <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{profileError}</p>
          )}

          {profileSuccess && (
            <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 rounded-lg px-3 py-2">
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
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center gap-2 mb-5">
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
            <Lock size={16} className="text-blue-600" />
          </div>
          <h2 className="text-base font-semibold text-gray-800">Alterar Senha</h2>
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
            <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{passwordError}</p>
          )}

          {passwordSuccess && (
            <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 rounded-lg px-3 py-2">
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
    </div>
  );
}
