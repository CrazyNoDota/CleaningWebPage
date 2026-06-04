'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { AdminShell } from '@/components/AdminShell';
import {
  ApiError,
  adminDeleteService,
  adminListServices,
  adminUpdateService,
  adminUploadServicePhoto,
} from '@/lib/api';
import type { AdminService } from '@/lib/types';

// Compress and convert an image file to WebP in the browser using Canvas
async function toWebP(file: File, maxSize = 1200, quality = 0.85): Promise<File> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close();
  const blob = await new Promise<Blob>((res) =>
    canvas.toBlob((b) => res(b!), 'image/webp', quality),
  );
  const name = file.name.replace(/\.[^.]+$/, '') + '.webp';
  return new File([blob], name, { type: 'image/webp' });
}

export default function ServiceEditPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const router = useRouter();

  const [service, setService] = useState<AdminService | null>(null);
  const [draft, setDraft] = useState<AdminService | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [flash, setFlash] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    adminListServices()
      .then((list) => {
        const s = list.find((x) => x.id === id) ?? null;
        setService(s);
        setDraft(s ? { ...s } : null);
      })
      .catch((e: ApiError) => setError(e.message));
  }, [id]);

  const dirty =
    draft !== null &&
    service !== null &&
    (draft.nameRu !== service.nameRu ||
      draft.nameKk !== service.nameKk ||
      draft.nameEn !== service.nameEn ||
      draft.descRu !== service.descRu ||
      draft.descKk !== service.descKk ||
      draft.descEn !== service.descEn ||
      draft.photoUrl !== service.photoUrl ||
      draft.basePrice !== service.basePrice ||
      draft.isActive !== service.isActive);

  async function onSave() {
    if (!draft || !dirty) return;
    setSaving(true);
    setError(null);
    try {
      const updated = await adminUpdateService(id, {
        nameRu: draft.nameRu,
        nameKk: draft.nameKk,
        nameEn: draft.nameEn,
        descRu: draft.descRu,
        descKk: draft.descKk,
        descEn: draft.descEn,
        photoUrl: draft.photoUrl ?? undefined,
        basePrice: draft.basePrice,
        isActive: draft.isActive,
      });
      setService(updated);
      setDraft({ ...updated });
      showFlash('Сохранено');
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'не удалось сохранить');
    } finally {
      setSaving(false);
    }
  }

  async function onDelete() {
    if (!draft) return;
    if (!window.confirm(`Удалить услугу «${draft.nameRu}»? Это действие необратимо.`)) return;
    setDeleting(true);
    setError(null);
    try {
      await adminDeleteService(id);
      router.push('/services');
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'не удалось удалить');
      setDeleting(false);
    }
  }

  async function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !draft) return;
    setUploading(true);
    setError(null);
    try {
      const webpFile = await toWebP(file);
      const url = await adminUploadServicePhoto(webpFile);
      setDraft((d) => d ? { ...d, photoUrl: url } : d);
      showFlash('Фото загружено');
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'не удалось загрузить фото');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  function showFlash(msg: string) {
    setFlash(msg);
    setTimeout(() => setFlash(null), 2000);
  }

  return (
    <AdminShell>
      <div className="max-w-2xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <Link href="/services" className="text-sm text-slate-500 hover:text-slate-900">
          ← Все услуги
        </Link>

        {!draft && (
          <p className="mt-6 text-slate-400">{error ?? 'Загрузка…'}</p>
        )}

        {draft && (
          <>
            <h1 className="mt-2 text-2xl font-bold text-slate-900">{draft.nameRu}</h1>
            <p className="mt-1 text-sm text-slate-400">slug: {draft.slug}</p>

            {error && (
              <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
            )}

            <div className="mt-6 space-y-6">
              {/* Photo upload */}
              <section className="card">
                <h2 className="font-semibold text-slate-900">Фото обложки</h2>
                <p className="mt-1 text-xs text-slate-500">
                  Автоматически сжимается и конвертируется в WebP (макс. 1200px, 85% качество).
                </p>
                <div className="mt-3 flex items-center gap-4">
                  <div className="size-24 overflow-hidden rounded-xl bg-slate-100 shrink-0">
                    {draft.photoUrl ? (
                      <img src={draft.photoUrl} alt="cover" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-slate-300 text-3xl">
                        🖼
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <input
                      ref={fileRef}
                      type="file"
                      accept="image/*"
                      onChange={onFileChange}
                      className="hidden"
                      id="photo-input"
                    />
                    <label
                      htmlFor="photo-input"
                      className={`btn-secondary cursor-pointer ${uploading ? 'opacity-60 pointer-events-none' : ''}`}
                    >
                      {uploading ? 'Загрузка…' : 'Выбрать фото'}
                    </label>
                    {draft.photoUrl && (
                      <button
                        type="button"
                        onClick={() => setDraft((d) => d ? { ...d, photoUrl: null } : d)}
                        className="block text-xs text-red-500 hover:text-red-700"
                      >
                        Удалить фото
                      </button>
                    )}
                  </div>
                </div>
              </section>

              {/* Names */}
              <section className="card space-y-4">
                <h2 className="font-semibold text-slate-900">Название</h2>
                <Field label="Русский">
                  <input value={draft.nameRu} onChange={(e) => setDraft((d) => d ? { ...d, nameRu: e.target.value } : d)} className="input" required />
                </Field>
                <Field label="Казахский">
                  <input value={draft.nameKk} onChange={(e) => setDraft((d) => d ? { ...d, nameKk: e.target.value } : d)} className="input" />
                </Field>
                <Field label="Английский">
                  <input value={draft.nameEn} onChange={(e) => setDraft((d) => d ? { ...d, nameEn: e.target.value } : d)} className="input" />
                </Field>
              </section>

              {/* Descriptions */}
              <section className="card space-y-4">
                <h2 className="font-semibold text-slate-900">Описание</h2>
                <Field label="Русский">
                  <textarea
                    value={draft.descRu}
                    onChange={(e) => setDraft((d) => d ? { ...d, descRu: e.target.value } : d)}
                    rows={3}
                    className="input resize-y"
                  />
                </Field>
                <Field label="Казахский">
                  <textarea
                    value={draft.descKk}
                    onChange={(e) => setDraft((d) => d ? { ...d, descKk: e.target.value } : d)}
                    rows={3}
                    className="input resize-y"
                  />
                </Field>
                <Field label="Английский">
                  <textarea
                    value={draft.descEn}
                    onChange={(e) => setDraft((d) => d ? { ...d, descEn: e.target.value } : d)}
                    rows={3}
                    className="input resize-y"
                  />
                </Field>
              </section>

              {/* Price & status */}
              <section className="card space-y-4">
                <h2 className="font-semibold text-slate-900">Цена и статус</h2>
                <Field label="Базовая цена, ₸">
                  <input
                    type="number"
                    min={0}
                    step={50}
                    value={Math.round(draft.basePrice / 100)}
                    onChange={(e) =>
                      setDraft((d) =>
                        d ? { ...d, basePrice: Math.max(0, Math.round(Number(e.target.value) * 100)) } : d,
                      )
                    }
                    className="input"
                  />
                  <span className="mt-1 block text-xs text-slate-400">
                    Начальная цена «от». Итоговая считается формулой по площади и опциям.
                  </span>
                </Field>
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={draft.isActive}
                    onChange={(e) => setDraft((d) => (d ? { ...d, isActive: e.target.checked } : d))}
                    className="size-4"
                  />
                  <span className="text-sm text-slate-700">
                    Активна (видна в приложении и на сайте)
                  </span>
                </label>
              </section>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3">
                {flash && <span className="text-sm text-emerald-600">{flash}</span>}
                <button
                  type="button"
                  onClick={onSave}
                  disabled={!dirty || saving}
                  className="btn-primary"
                >
                  {saving ? 'Сохранение…' : 'Сохранить'}
                </button>
              </div>

              {/* Danger zone */}
              <section className="rounded-2xl border border-red-200 bg-red-50/50 p-4">
                <h2 className="font-semibold text-red-700">Удаление</h2>
                <p className="mt-1 text-xs text-slate-500">
                  Услугу без связанных заказов можно удалить навсегда. Иначе деактивируйте её выше.
                </p>
                <button
                  type="button"
                  onClick={onDelete}
                  disabled={deleting}
                  className="mt-3 rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-100 disabled:opacity-60"
                >
                  {deleting ? 'Удаление…' : 'Удалить услугу'}
                </button>
              </section>
            </div>
          </>
        )}
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
