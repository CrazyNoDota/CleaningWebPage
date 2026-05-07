import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import { SiteHeader } from '@/components/SiteHeader';

export default async function HomePage({
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

      <main className="flex-1">
        <section className="bg-gradient-to-b from-brand-50 to-white">
          <div className="mx-auto max-w-6xl px-6 py-20 text-center">
            <p className="text-sm uppercase tracking-wider text-brand-600 font-semibold">
              {t('common.tagline')}
            </p>
            <h1 className="mt-3 text-4xl md:text-5xl font-bold text-slate-900 max-w-3xl mx-auto">
              {t('home.heroTitle')}
            </h1>
            <Link
              href="/book"
              className="mt-8 inline-block rounded-xl bg-brand-600 px-8 py-3 text-white font-semibold hover:bg-brand-700"
            >
              {t('home.heroCta')}
            </Link>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 py-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <Stat value="8" label={t('home.stats.experience')} />
          <Stat value="1000+" label={t('home.stats.cleaners')} />
          <Stat value="15%" label={t('home.stats.discount')} />
        </section>
      </main>

      <footer className="border-t border-slate-200">
        <div className="mx-auto max-w-6xl px-6 py-6 text-sm text-slate-500 flex items-center justify-between">
          <span>© 2026 {t('common.brand')}</span>
          <span>{t('footer.rights')}</span>
        </div>
      </footer>
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 text-center">
      <div className="text-3xl font-bold text-brand-600">{value}</div>
      <div className="mt-1 text-sm text-slate-600">{label}</div>
    </div>
  );
}
