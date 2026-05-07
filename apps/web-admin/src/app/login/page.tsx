'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ApiError, requestOtp, verifyOtp } from '@/lib/api';
import { ADMIN_ROLES, saveSession } from '@/lib/auth';

type Stage = 'phone' | 'code';

export default function LoginPage() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get('next') ?? '/';

  const [stage, setStage] = useState<Stage>('phone');
  const [phone, setPhone] = useState('+7');
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSendCode(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await requestOtp(phone);
      setStage('code');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'не удалось отправить код');
    } finally {
      setBusy(false);
    }
  }

  async function onVerify(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const session = await verifyOtp(phone, code);
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

        {stage === 'phone' && (
          <form onSubmit={onSendCode} className="mt-6 space-y-4">
            <Field label="Номер телефона" hint="Формат: +77011234567">
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="input"
                required
                pattern="^\+\d{10,15}$"
                placeholder="+77011234567"
                autoFocus
              />
            </Field>
            <button type="submit" className="btn-primary w-full" disabled={busy}>
              {busy ? 'Загрузка…' : 'Получить код'}
            </button>
          </form>
        )}

        {stage === 'code' && (
          <form onSubmit={onVerify} className="mt-6 space-y-4">
            <p className="text-xs text-slate-500">
              В режиме разработки код печатается в логи API.
            </p>
            <Field label="Код из СМС">
              <input
                type="text"
                inputMode="numeric"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                className="input tracking-widest text-center"
                required
                maxLength={6}
                pattern="\d{6}"
                autoFocus
              />
            </Field>
            <button type="submit" className="btn-primary w-full" disabled={busy}>
              {busy ? 'Загрузка…' : 'Войти'}
            </button>
            <button
              type="button"
              onClick={() => {
                setStage('phone');
                setCode('');
                setError(null);
              }}
              className="block w-full btn-ghost"
            >
              Указать другой номер
            </button>
          </form>
        )}

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
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      {hint && <span className="block text-xs text-slate-400">{hint}</span>}
      <div className="mt-1">{children}</div>
    </label>
  );
}
