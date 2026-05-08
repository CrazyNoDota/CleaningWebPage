'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ApiError, adminLogin } from '@/lib/api';
import { ADMIN_ROLES, saveSession } from '@/lib/auth';

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginInner />
    </Suspense>
  );
}

function LoginInner() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get('next') ?? '/';

  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const session = await adminLogin(login, password);
      if (!ADMIN_ROLES.has(session.user.role)) {
        setError(`У этой учётной записи нет прав менеджера (роль: ${session.user.role}).`);
        return;
      }
      saveSession(session);
      router.push(next);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'не удалось войти');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-6">
      <div className="w-full max-w-md card">
        <div className="text-xs uppercase tracking-wider text-brand-600 font-semibold">
          CleaningService
        </div>
        <h1 className="mt-1 text-xl font-bold text-slate-900">Вход в админку</h1>
        <p className="mt-1 text-sm text-slate-500">
          Только для менеджеров и администраторов.
        </p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <Field label="Логин">
            <input
              type="text"
              value={login}
              onChange={(e) => setLogin(e.target.value)}
              className="input"
              required
              autoFocus
              autoComplete="username"
            />
          </Field>
          <Field label="Пароль">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input"
              required
              autoComplete="current-password"
            />
          </Field>
          <button type="submit" className="btn-primary w-full" disabled={busy}>
            {busy ? 'Загрузка…' : 'Войти'}
          </button>
        </form>

        {error && (
          <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}
