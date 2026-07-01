import { useTranslations } from 'next-intl';

export default function Loading() {
  const t = useTranslations('common');

  return (
    <main
      className="flex min-h-screen items-center justify-center px-6"
      aria-busy="true"
    >
      <div className="flex flex-col items-center gap-4 text-ink-700">
        <span
          className="size-10 animate-spin rounded-full border-4 border-brand-100 border-t-brand-600"
          aria-hidden="true"
        />
        <p className="text-sm font-medium">{t('loading')}</p>
      </div>
    </main>
  );
}
