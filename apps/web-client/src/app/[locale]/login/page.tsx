'use client';

import { Suspense, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter, useSearchParams } from 'next/navigation';
import { SiteHeader } from '@/components/SiteHeader';
import { GoogleSignInButton } from '@/components/GoogleSignInButton';
import { ApiError, googleLogin, requestOtp, verifyOtp } from '@/lib/api';
import { saveSession } from '@/lib/auth';

type Stage = 'phone' | 'code';

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginInner />
    </Suspense>
  );
}

function LoginInner() {
  const t = useTranslations();
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get('next');

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
      setError(err instanceof ApiError ? err.message : 'request failed');
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
      saveSession(session);
      router.push(next ?? '/');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'verify failed');
    } finally {
      setBusy(false);
    }
  }

  async function onGoogleCredential(idToken: string) {
    setError(null);
    setBusy(true);
    try {
      const session = await googleLogin(idToken);
      saveSession(session);
      router.push(next ?? '/');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Google sign-in failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1 flex items-start justify-center pt-16 px-6">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-bold text-slate-900">{t('login.title')}</h1>

          {stage === 'phone' && (
            <form onSubmit={onSendCode} className="mt-6 space-y-4">
              <Field label={t('login.phoneLabel')} hint={t('login.phoneHint')}>
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
                {busy ? t('common.loading') : t('login.sendCode')}
              </button>
            </form>
          )}

          {stage === 'phone' && (
            <>
              <div className="my-6 flex items-center gap-3 text-xs text-slate-400">
                <span className="h-px flex-1 bg-slate-200" />
                {t('login.orContinueWith')}
                <span className="h-px flex-1 bg-slate-200" />
              </div>
              <GoogleSignInButton onCredential={onGoogleCredential} />
            </>
          )}

          {stage === 'code' && (
            <form onSubmit={onVerify} className="mt-6 space-y-4">
              <p className="text-sm text-slate-500">{t('login.devCodeHint')}</p>
              <Field label={t('login.codeLabel')}>
                <input
                  type="text"
                  inputMode="numeric"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                  className="input tracking-widest text-center text-lg"
                  required
                  maxLength={6}
                  pattern="\d{6}"
                  autoFocus
                />
              </Field>
              <button type="submit" className="btn-primary w-full" disabled={busy}>
                {busy ? t('common.loading') : t('login.verify')}
              </button>
              <button
                type="button"
                onClick={() => {
                  setStage('phone');
                  setCode('');
                  setError(null);
                }}
                className="block w-full text-sm text-slate-500 hover:text-slate-900"
              >
                {t('login.wrongPhone')}
              </button>
            </form>
          )}

          {error && (
            <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </p>
          )}
        </div>
      </main>
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
      {hint && <span className="block text-xs text-slate-400 mb-1">{hint}</span>}
      <div className="mt-1">{children}</div>
    </label>
  );
}
