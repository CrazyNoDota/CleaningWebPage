'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { AdminShell } from '@/components/AdminShell';
import { Badges } from '@/app/cleaners/page';
import { ApiError, adminGetCleaner, adminUpdateCleaner } from '@/lib/api';
import type { AdminCleanerFull, VerificationStatus } from '@/lib/types';

export default function CleanerEditPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [cleaner, setCleaner] = useState<AdminCleanerFull | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [flash, setFlash] = useState<string | null>(null);

  useEffect(() => {
    adminGetCleaner(id).then(setCleaner).catch((e: ApiError) => setError(e.message));
  }, [id]);

  async function patch(payload: Parameters<typeof adminUpdateCleaner>[1]) {
    setBusy(true);
    setError(null);
    try {
      const next = await adminUpdateCleaner(id, payload);
      setCleaner(next);
      setFlash('Сохранено');
      setTimeout(() => setFlash(null), 1500);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'не удалось сохранить');
    } finally {
      setBusy(false);
    }
  }

  return (
    <AdminShell>
      <div className="px-8 py-8 max-w-3xl">
        <Link href="/cleaners" className="text-sm text-slate-500 hover:text-slate-900">
          ← Все клинеры
        </Link>

        {!cleaner && (
          <p className="mt-6 text-slate-400">{error ?? 'Загрузка…'}</p>
        )}

        {cleaner && (
          <>
            <div className="mt-2 flex items-start justify-between">
              <div>
                <h1 className="text-2xl font-bold text-slate-900">
                  {cleaner.user.name ?? cleaner.user.phone}
                </h1>
                <p className="mt-1 text-sm text-slate-500">{cleaner.user.phone}</p>
                <div className="mt-2">
                  <Badges
                    isActive={cleaner.isActive}
                    verificationStatus={cleaner.verificationStatus}
                  />
                </div>
              </div>
              <div className="text-right text-sm text-slate-500">
                <div>Завершённых заказов: <strong className="text-slate-900">{cleaner.completedOrdersCount}</strong></div>
                <div>
                  Рейтинг:{' '}
                  <strong className="text-slate-900">
                    {cleaner.ratingCount > 0
                      ? `${cleaner.ratingAvg.toFixed(2)} (${cleaner.ratingCount})`
                      : '—'}
                  </strong>
                </div>
              </div>
            </div>

            {/* Verification + active controls */}
            <section className="mt-6 card">
              <h2 className="font-semibold text-slate-900">Верификация и доступ</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {(['unverified', 'pending', 'verified', 'rejected'] as VerificationStatus[]).map(
                  (s) => (
                    <button
                      key={s}
                      type="button"
                      disabled={busy || cleaner.verificationStatus === s}
                      onClick={() => patch({ verificationStatus: s })}
                      className={`btn-secondary ${
                        cleaner.verificationStatus === s
                          ? '!bg-brand-50 !border-brand-600 !text-brand-700'
                          : ''
                      }`}
                    >
                      {labelForVerification(s)}
                    </button>
                  ),
                )}
              </div>
              <div className="mt-3 flex gap-2">
                {cleaner.isActive ? (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => patch({ isActive: false })}
                    className="btn-secondary !text-red-700 !border-red-300 hover:!bg-red-50"
                  >
                    Заблокировать
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => patch({ isActive: true })}
                    className="btn-primary"
                  >
                    Разблокировать
                  </button>
                )}
              </div>
            </section>

            <ProfileForm cleaner={cleaner} onSave={patch} busy={busy} />

            {flash && <p className="mt-4 text-sm text-emerald-700">{flash}</p>}
            {error && (
              <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </p>
            )}
          </>
        )}
      </div>
    </AdminShell>
  );
}

function ProfileForm({
  cleaner,
  onSave,
  busy,
}: {
  cleaner: AdminCleanerFull;
  onSave: (p: Parameters<typeof adminUpdateCleaner>[1]) => Promise<void>;
  busy: boolean;
}) {
  const [name, setName] = useState(cleaner.user.name ?? '');
  const [years, setYears] = useState(cleaner.yearsOfExperience);
  const [languages, setLanguages] = useState(cleaner.languages.join(', '));
  const [specialization, setSpecialization] = useState(cleaner.specialization.join(', '));
  const [bioRu, setBioRu] = useState(cleaner.bioRu);
  const [bioKk, setBioKk] = useState(cleaner.bioKk);
  const [bioEn, setBioEn] = useState(cleaner.bioEn);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    void onSave({
      name: name.trim(),
      yearsOfExperience: years,
      languages: parseList(languages),
      specialization: parseList(specialization),
      bioRu,
      bioKk,
      bioEn,
    });
  }

  return (
    <form onSubmit={onSubmit} className="mt-6 card space-y-4">
      <h2 className="font-semibold text-slate-900">Профиль</h2>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Полное имя">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            minLength={2}
            maxLength={120}
            required
            className="input"
          />
        </Field>
        <Field label="Опыт, лет">
          <input
            type="number"
            min={0}
            max={60}
            value={years}
            onChange={(e) => setYears(Math.max(0, Number(e.target.value)))}
            className="input"
          />
        </Field>
        <Field label="Языки (через запятую)">
          <input
            value={languages}
            onChange={(e) => setLanguages(e.target.value)}
            className="input"
          />
        </Field>
        <Field label="Специализация (через запятую)">
          <input
            value={specialization}
            onChange={(e) => setSpecialization(e.target.value)}
            className="input"
          />
        </Field>
      </div>
      <Field label="Биография (RU)">
        <textarea
          rows={2}
          value={bioRu}
          onChange={(e) => setBioRu(e.target.value)}
          maxLength={2000}
          className="input"
        />
      </Field>
      <Field label="Биография (KK)">
        <textarea
          rows={2}
          value={bioKk}
          onChange={(e) => setBioKk(e.target.value)}
          maxLength={2000}
          className="input"
        />
      </Field>
      <Field label="Биография (EN)">
        <textarea
          rows={2}
          value={bioEn}
          onChange={(e) => setBioEn(e.target.value)}
          maxLength={2000}
          className="input"
        />
      </Field>
      <div className="flex justify-end">
        <button type="submit" className="btn-primary" disabled={busy}>
          {busy ? 'Сохраняем…' : 'Сохранить'}
        </button>
      </div>
    </form>
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

function parseList(s: string): string[] {
  return s
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean);
}

function labelForVerification(s: VerificationStatus): string {
  return {
    unverified: 'Не проверен',
    pending: 'На проверке',
    verified: 'Проверен',
    rejected: 'Отклонён',
  }[s];
}
