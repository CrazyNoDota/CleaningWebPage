'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { ApiError, submitReview } from '@/lib/api';

interface Props {
  orderId: string;
  /** Called once the review is accepted by the server (status is now `reviewed`). */
  onSubmitted: () => void;
}

export function ReviewForm({ orderId, onSubmitted }: Props) {
  const t = useTranslations();
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (rating < 1 || rating > 5) {
      setError(t('review.errorPickRating'));
      return;
    }
    setBusy(true);
    try {
      await submitReview(orderId, {
        rating,
        comment: comment.trim() || undefined,
      });
      onSubmitted();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'submit failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="card space-y-4">
      <div>
        <h2 className="font-semibold text-slate-900">{t('review.prompt')}</h2>
        <p className="text-sm text-slate-500">{t('review.ratingHint')}</p>
      </div>

      <div
        className="flex gap-1 text-3xl select-none"
        onMouseLeave={() => setHover(0)}
      >
        {[1, 2, 3, 4, 5].map((n) => {
          const filled = (hover || rating) >= n;
          return (
            <button
              key={n}
              type="button"
              aria-label={`${n} stars`}
              onMouseEnter={() => setHover(n)}
              onClick={() => setRating(n)}
              className={`leading-none transition-colors ${
                filled ? 'text-amber-400' : 'text-slate-300'
              } hover:text-amber-400`}
            >
              ★
            </button>
          );
        })}
      </div>

      <label className="block">
        <span className="text-sm font-medium text-slate-700">
          {t('review.commentLabel')}
        </span>
        <textarea
          rows={4}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder={t('review.commentPlaceholder')}
          maxLength={2000}
          className="input mt-1"
        />
      </label>

      {error && (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      )}

      <button type="submit" className="btn-primary" disabled={busy}>
        {busy ? t('common.loading') : t('review.submit')}
      </button>
    </form>
  );
}

export function ReviewThanks() {
  const t = useTranslations();
  return (
    <div className="card text-center">
      <div className="text-4xl text-amber-400">★★★★★</div>
      <h2 className="mt-2 font-semibold text-slate-900">{t('review.thanksTitle')}</h2>
      <p className="mt-1 text-sm text-slate-500">{t('review.thanksBody')}</p>
    </div>
  );
}
