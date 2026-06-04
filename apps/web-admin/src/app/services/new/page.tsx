'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { AdminShell } from '@/components/AdminShell';
import { ApiError, adminCreateService } from '@/lib/api';

const TYPES: { value: string; label: string }[] = [
  { value: 'apartment', label: 'Квартира / дом' },
  { value: 'office', label: 'Офис' },
  { value: 'post_renovation', label: 'После ремонта' },
  { value: 'subscription', label: 'Подписка' },
];

export default function NewServicePage() {
  const router = useRouter();
  const [slug, setSlug] = useState('');
  const [type, setType] = useState('apartment');
  const [nameRu, setNameRu] = useState('');
  const [nameKk, setNameKk] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [descRu, setDescRu] = useState('');
  const [priceKzt, setPriceKzt] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const slugValid = /^[a-z0-9-]+$/.test(slug);
  const canSave = slugValid && nameRu.trim().length > 0 && Number(priceKzt) >= 0 && priceKzt !== '';

  async function onCreate() {
    if (!canSave) return;
    setSaving(true);
    setError(null);
    try {
      const created = await adminCreateService({
        slug,
        type,
        nameRu: nameRu.trim(),
        nameKk: nameKk.trim() || undefined,
        nameEn: nameEn.trim() || undefined,
        descRu: descRu.trim() || undefined,
        basePrice: Math.round(Number(priceKzt) * 100),
      });
      router.push(`/services/${created.id}`);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'не удалось создать услугу');
      setSaving(false);
    }
  }

  return (
    <AdminShell>
      <div className="max-w-2xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <Link href="/services" className="text-sm text-slate-500 hover:text-slate-900">
          ← Все услуги
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-slate-900">Новая услуга</h1>
        <p className="mt-1 text-sm text-slate-500">
          Фото можно загрузить после создания на странице услуги.
        </p>

        {error && (
          <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
        )}

        <div className="mt-6 space-y-6">
          <section className="card space-y-4">
            <Field label="Идентификатор (slug)">
              <input
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase())}
                className="input"
                placeholder="apartment-express"
              />
              <span className="mt-1 block text-xs text-slate-400">
                Латиница, цифры и дефис. Менять потом нежелательно.
              </span>
              {slug && !slugValid && (
                <span className="mt-1 block text-xs text-red-500">
                  Только строчные латинские буквы, цифры и дефис.
                </span>
              )}
            </Field>
            <Field label="Тип">
              <select value={type} onChange={(e) => setType(e.target.value)} className="input">
                {TYPES.map((tt) => (
                  <option key={tt.value} value={tt.value}>
                    {tt.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Базовая цена, ₸">
              <input
                type="number"
                min={0}
                step={50}
                value={priceKzt}
                onChange={(e) => setPriceKzt(e.target.value)}
                className="input"
                placeholder="5000"
              />
            </Field>
          </section>

          <section className="card space-y-4">
            <h2 className="font-semibold text-slate-900">Название</h2>
            <Field label="Русский">
              <input value={nameRu} onChange={(e) => setNameRu(e.target.value)} className="input" required />
            </Field>
            <Field label="Казахский">
              <input value={nameKk} onChange={(e) => setNameKk(e.target.value)} className="input" />
            </Field>
            <Field label="Английский">
              <input value={nameEn} onChange={(e) => setNameEn(e.target.value)} className="input" />
            </Field>
          </section>

          <section className="card space-y-4">
            <h2 className="font-semibold text-slate-900">Описание (рус.)</h2>
            <textarea
              value={descRu}
              onChange={(e) => setDescRu(e.target.value)}
              rows={3}
              className="input resize-y"
            />
          </section>

          <div className="flex items-center justify-end gap-3">
            <button type="button" onClick={onCreate} disabled={!canSave || saving} className="btn-primary">
              {saving ? 'Создание…' : 'Создать услугу'}
            </button>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}
