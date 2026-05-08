'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { upload } from '@vercel/blob/client';
import { SiteHeader } from '@/components/SiteHeader';
import { ApiError, submitApplication } from '@/lib/api';

const ALLOWED_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg',
  'image/png',
];
const MAX_BYTES = 5 * 1024 * 1024;

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';

export default function CareersPage() {
  const t = useTranslations('careers');

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('+7');
  const [city, setCity] = useState('');
  const [age, setAge] = useState('');
  const [experience, setExperience] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [stage, setStage] = useState<'idle' | 'uploading' | 'submitting'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    setError(null);
    const f = e.target.files?.[0] ?? null;
    if (f && f.size > MAX_BYTES) {
      setError(t('fileTooLarge'));
      e.target.value = '';
      setFile(null);
      return;
    }
    setFile(f);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      let resumeUrl: string | undefined;
      if (file) {
        setStage('uploading');
        const blob = await upload(`resumes/${Date.now()}-${file.name}`, file, {
          access: 'public',
          contentType: file.type,
          handleUploadUrl: `${API_BASE}/applications/resume`,
        });
        resumeUrl = blob.url;
      }

      setStage('submitting');
      await submitApplication({
        fullName: fullName.trim(),
        phone: phone.trim(),
        cityFreeText: city.trim() || undefined,
        age: age ? Number(age) : undefined,
        experience: experience.trim() || undefined,
        resumeUrl,
      });
      setDone(true);
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setError(t('duplicateError'));
      } else {
        setError(err instanceof Error ? err.message : 'failed');
      }
    } finally {
      setBusy(false);
      setStage('idle');
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1 flex items-start justify-center pt-12 pb-16 px-6">
        <div className="w-full max-w-2xl">
          <h1 className="text-3xl font-extrabold text-slate-900">{t('title')}</h1>
          <p className="mt-2 text-slate-600">{t('lead')}</p>

          {done ? (
            <div className="mt-8 rounded-2xl border border-green-200 bg-green-50 p-6 text-green-800">
              ✅ {t('success')}
            </div>
          ) : (
            <form
              onSubmit={onSubmit}
              className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-5"
            >
              <Field label={t('fullNameLabel')}>
                <input
                  type="text"
                  className="input"
                  required
                  minLength={2}
                  maxLength={120}
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </Field>

              <Field label={t('phoneLabel')} hint={t('phoneHint')}>
                <input
                  type="tel"
                  className="input"
                  required
                  pattern="^\+\d{10,15}$"
                  placeholder="+77011234567"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </Field>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <Field label={t('cityLabel')}>
                  <input
                    type="text"
                    className="input"
                    maxLength={120}
                    placeholder="Astana"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                  />
                </Field>
                <Field label={t('ageLabel')}>
                  <input
                    type="number"
                    className="input"
                    min={16}
                    max={80}
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                  />
                </Field>
              </div>

              <Field label={t('experienceLabel')} hint={t('experienceHint')}>
                <textarea
                  className="input min-h-28"
                  maxLength={2000}
                  value={experience}
                  onChange={(e) => setExperience(e.target.value)}
                />
              </Field>

              <Field label={t('resumeLabel')} hint={t('resumeHint')}>
                <input
                  type="file"
                  accept={ALLOWED_TYPES.join(',')}
                  onChange={onFileChange}
                  className="block w-full text-sm text-slate-700
                    file:mr-3 file:rounded-lg file:border-0
                    file:bg-brand-600 file:text-white
                    file:px-4 file:py-2 file:font-semibold
                    hover:file:bg-brand-700"
                />
              </Field>

              {error && (
                <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </p>
              )}

              <button type="submit" className="btn-primary w-full" disabled={busy}>
                {busy
                  ? stage === 'uploading'
                    ? t('sending')
                    : t('submitting')
                  : t('submit')}
              </button>
            </form>
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
      {hint && <span className="block text-xs text-slate-400 mt-0.5">{hint}</span>}
      <div className="mt-1.5">{children}</div>
    </label>
  );
}
