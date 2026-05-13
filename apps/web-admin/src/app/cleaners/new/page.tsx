'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AdminShell } from '@/components/AdminShell';
import { ApiError, adminCreateCleaner } from '@/lib/api';

export default function NewCleanerPage() {
  const router = useRouter();
  const [phone, setPhone] = useState('+7');
  const [name, setName] = useState('');
  const [years, setYears] = useState(0);
  const [languages, setLanguages] = useState('ru,kk');
  const [specialization, setSpecialization] = useState('apartment');
  const [bioRu, setBioRu] = useState('');
  const [bioKk, setBioKk] = useState('');
  const [bioEn, setBioEn] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const created = await adminCreateCleaner({
        phone,
        name,
        yearsOfExperience: years,
        languages: parseList(languages),
        specialization: parseList(specialization),
        bioRu: bioRu || undefined,
        bioKk: bioKk || undefined,
        bioEn: bioEn || undefined,
      });
      router.push(`/cleaners/${created.id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'не удалось создать');
    } finally {
      setBusy(false);
    }
  }

  return (
    <AdminShell>
      <div className="max-w-2xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <Link href="/cleaners" className="text-sm text-slate-500 hover:text-slate-900">
          ← Все клинеры
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-slate-900">Новый клинер</h1>
        <p className="mt-1 text-sm text-slate-500">
          Если телефон уже существует в системе, профиль клинера будет привязан к
          существующему пользователю.
        </p>

        <form onSubmit={onSubmit} className="mt-6 card space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Телефон" hint="+77011234567">
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                pattern="^\+\d{10,15}$"
                required
                className="input"
              />
            </Field>
            <Field label="Полное имя">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                minLength={2}
                maxLength={120}
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

          <div className="grid grid-cols-1 gap-3">
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
          </div>

          {error && (
            <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
          )}

          <div className="flex flex-col justify-end gap-2 sm:flex-row">
            <Link href="/cleaners" className="btn-secondary text-center">
              Отмена
            </Link>
            <button type="submit" className="btn-primary" disabled={busy}>
              {busy ? 'Сохраняем…' : 'Создать'}
            </button>
          </div>
        </form>
      </div>
    </AdminShell>
  );
}

function parseList(s: string): string[] {
  return s
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean);
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
