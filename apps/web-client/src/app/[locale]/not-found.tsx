import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';

export default function NotFound() {
  const t = useTranslations('notFound');

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 py-16 text-center">
      <p className="text-6xl font-extrabold text-brand-600">404</p>
      <h1 className="section-title mt-4">{t('title')}</h1>
      <p className="mt-2 max-w-md text-ink-700">{t('body')}</p>
      <Link href="/" className="btn-primary mt-6">
        {t('home')}
      </Link>
    </main>
  );
}
