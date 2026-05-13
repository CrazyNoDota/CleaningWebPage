import { getTranslations, setRequestLocale } from 'next-intl/server';
import { SiteHeader } from '@/components/SiteHeader';

export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1 mx-auto max-w-3xl px-4 md:px-6 py-12">
        <h1 className="text-3xl md:text-4xl font-extrabold text-ink-900">
          {t('page.about.title')}
        </h1>
        <p className="mt-4 max-w-2xl text-lg leading-8 text-ink-700">{t('page.about.intro')}</p>
        <dl className="mt-8 grid grid-cols-1 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-soft sm:grid-cols-3 sm:divide-x sm:divide-slate-200">
          <div className="border-b border-slate-200 px-6 py-5 sm:border-b-0">
            <dt className="text-sm text-ink-700">{t('home.stats.experience')}</dt>
            <dd className="mt-1 whitespace-nowrap text-2xl font-bold text-brand-600">
              8 лет
            </dd>
          </div>
          <div className="border-b border-slate-200 px-6 py-5 sm:border-b-0">
            <dt className="text-sm text-ink-700">{t('home.stats.cleaners')}</dt>
            <dd className="mt-1 whitespace-nowrap text-2xl font-bold text-brand-600">
              1 000+
            </dd>
          </div>
          <div className="px-6 py-5">
            <dt className="text-sm text-ink-700">Centras Insurance</dt>
            <dd className="mt-1 whitespace-nowrap text-2xl font-bold text-brand-600">
              16M ₸
            </dd>
          </div>
        </dl>
      </main>
    </div>
  );
}
