'use client';

import { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations('error');

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 py-16 text-center">
      <p className="text-6xl font-extrabold text-brand-600">500</p>
      <h1 className="section-title mt-4">{t('title')}</h1>
      <p className="mt-2 max-w-md text-ink-700">{t('body')}</p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <button type="button" onClick={() => reset()} className="btn-primary">
          {t('retry')}
        </button>
        <Link href="/" className="btn-secondary">
          {t('home')}
        </Link>
      </div>
    </main>
  );
}
