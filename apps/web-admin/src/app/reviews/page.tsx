'use client';

import { useEffect, useState } from 'react';
import { AdminShell } from '@/components/AdminShell';
import { ApiError, adminListReviews, adminModerateReview } from '@/lib/api';
import {
  formatDateTimeRu,
  reviewStatusBadgeClass,
  reviewStatusLabel,
} from '@/lib/format';
import type { AdminReview, ReviewStatusValue } from '@/lib/types';

const STATUSES: ReviewStatusValue[] = ['pending', 'published', 'hidden', 'rejected'];

export default function ReviewsPage() {
  const [items, setItems] = useState<AdminReview[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<ReviewStatusValue>('pending');
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setItems(null);
    setError(null);
    adminListReviews({ status })
      .then((rows) => {
        if (!cancelled) setItems(rows);
      })
      .catch((e: ApiError) => {
        if (!cancelled) setError(e.message);
      });
    return () => {
      cancelled = true;
    };
  }, [status]);

  async function moderate(
    review: AdminReview,
    next: Exclude<ReviewStatusValue, 'pending'>,
  ) {
    setBusyId(review.id);
    setError(null);
    try {
      const updated = await adminModerateReview(review.id, next);
      setItems((prev) =>
        prev === null
          ? prev
          : status === updated.status
            ? prev.map((r) => (r.id === updated.id ? updated : r))
            : prev.filter((r) => r.id !== updated.id),
      );
    } catch (e) {
      setError((e as ApiError).message);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <AdminShell>
      <div className="px-8 py-8 max-w-6xl">
        <h1 className="text-2xl font-bold text-slate-900">Отзывы</h1>
        <p className="text-sm text-slate-500">
          Очередь модерации. По умолчанию показаны новые отзывы, ожидающие
          проверки.
        </p>

        <div className="mt-6 flex gap-3 text-sm">
          <label className="flex items-center gap-2">
            <span className="text-slate-500">Статус:</span>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as ReviewStatusValue)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm"
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {reviewStatusLabel(s)}
                </option>
              ))}
            </select>
          </label>
        </div>

        {error && (
          <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        )}

        <div className="mt-6 space-y-3">
          {items === null && (
            <div className="card text-center text-slate-400">Загрузка…</div>
          )}
          {items?.length === 0 && (
            <div className="card text-center text-slate-400">
              Под текущий фильтр отзывов нет.
            </div>
          )}
          {items?.map((r) => (
            <article key={r.id} className="card">
              <header className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-amber-500" aria-label={`${r.rating}/5`}>
                      {'★'.repeat(r.rating)}
                      <span className="text-slate-300">
                        {'★'.repeat(5 - r.rating)}
                      </span>
                    </span>
                    <span className={reviewStatusBadgeClass(r.status)}>
                      {reviewStatusLabel(r.status)}
                    </span>
                  </div>
                  <div className="mt-1 text-xs text-slate-400">
                    Заказ {r.orderId.slice(0, 8)} · {formatDateTimeRu(r.createdAt)}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {r.status !== 'published' && (
                    <button
                      type="button"
                      disabled={busyId === r.id}
                      onClick={() => moderate(r, 'published')}
                      className="btn-primary"
                    >
                      Опубликовать
                    </button>
                  )}
                  {r.status !== 'hidden' && (
                    <button
                      type="button"
                      disabled={busyId === r.id}
                      onClick={() => moderate(r, 'hidden')}
                      className="btn-secondary"
                    >
                      Скрыть
                    </button>
                  )}
                  {r.status !== 'rejected' && (
                    <button
                      type="button"
                      disabled={busyId === r.id}
                      onClick={() => moderate(r, 'rejected')}
                      className="btn-secondary"
                    >
                      Отклонить
                    </button>
                  )}
                </div>
              </header>

              {r.comment && (
                <p className="mt-3 whitespace-pre-wrap text-sm text-slate-700">
                  {r.comment}
                </p>
              )}
              {r.tags.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {r.tags.map((t) => (
                    <span key={t} className="badge-slate">
                      {t}
                    </span>
                  ))}
                </div>
              )}
            </article>
          ))}
        </div>
      </div>
    </AdminShell>
  );
}
