import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import { SiteHeader } from '@/components/SiteHeader';
import { listServices } from '@/lib/api';
import { formatMoney } from '@/lib/format';
import type { Locale, Service } from '@/lib/types';

export default async function ServicesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();
  const services = await getServices(locale as Locale);

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1 mx-auto max-w-6xl px-4 md:px-6 py-10">
        <h1 className="text-3xl md:text-4xl font-extrabold text-ink-900">
          {t('page.services.title')}
        </h1>
        <p className="mt-2 text-ink-700">{t('page.services.intro')}</p>

        {services.length > 0 ? (
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
            {services.map((s) => (
              <div key={s.id} className="card flex flex-col overflow-hidden p-0">
                <div className="relative h-40 w-full bg-slate-100">
                  {s.photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={s.photoUrl} alt={s.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-4xl text-slate-300">
                      🧹
                    </div>
                  )}
                </div>
                <div className="flex flex-1 flex-col p-5">
                  <h3 className="text-lg font-bold text-ink-900">{s.name}</h3>
                  <div className="mt-1 text-xl font-extrabold text-brand-600">
                    {t('home.pricing.from')} {formatMoney(s.basePrice, s.currency, locale as Locale)}
                  </div>
                  {s.description && (
                    <p className="mt-2 text-sm text-ink-700">{s.description}</p>
                  )}
                  <Link href="/book" className="mt-4 inline-block btn-primary text-center">
                    {t('home.pricing.order')}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          // Fallback to static tiers if the catalog API is unavailable.
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
        )}
      </main>
    </div>
  );
}

async function getServices(locale: Locale): Promise<Service[]> {
  try {
    return await Promise.race([
      listServices(locale),
      new Promise<Service[]>((resolve) => {
        setTimeout(() => resolve([]), 1500);
      }),
    ]);
  } catch {
    return [];
  }
}
