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
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="card text-center">
            <div className="text-5xl font-extrabold leading-none text-brand-600 md:text-6xl">8</div>
            <div className="mt-3 text-sm text-ink-400">{t('home.stats.experience')}</div>
          </div>
          <div className="card text-center">
            <div className="text-5xl font-extrabold leading-none text-brand-600 md:text-6xl">1 000+</div>
            <div className="mt-3 text-sm text-ink-400">{t('home.stats.cleaners')}</div>
          </div>
          <div className="card text-center">
            <div className="text-5xl font-extrabold leading-none text-brand-600 md:text-6xl">16M ₸</div>
            <div className="mt-3 text-sm text-ink-400">Centras Insurance</div>
          </div>
        </div>
      </main>
    </div>
  );
}
