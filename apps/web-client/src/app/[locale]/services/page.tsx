import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import { SiteHeader } from '@/components/SiteHeader';

export default async function ServicesPage({
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
      <main className="flex-1 mx-auto max-w-6xl px-4 md:px-6 py-10">
        <h1 className="text-3xl md:text-4xl font-extrabold text-ink-900">
          {t('page.services.title')}
        </h1>
        <p className="mt-2 text-ink-700">{t('page.services.intro')}</p>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          {(['maintenance', 'deep', 'renovation'] as const).map((tier) => (
            <div key={tier} className="card">
              <h3 className="text-lg font-bold text-ink-900">
                {t(`home.pricing.${tier}.name`)}
              </h3>
              <p className="mt-2 text-sm text-ink-700">
                {t(`home.pricing.${tier}.desc`)}
              </p>
              <Link href="/book" className="mt-4 inline-block btn-primary">
                {t('home.pricing.order')}
              </Link>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
