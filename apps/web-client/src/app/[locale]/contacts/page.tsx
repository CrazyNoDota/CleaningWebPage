import { getTranslations, setRequestLocale } from 'next-intl/server';
import { SiteHeader } from '@/components/SiteHeader';

const PHONE = '+7 (700) 301-84-05';

export default async function ContactsPage({
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
      <main className="flex-1 mx-auto max-w-4xl px-4 md:px-6 py-12">
        <h1 className="text-3xl md:text-4xl font-extrabold text-ink-900">
          {t('page.contacts.title')}
        </h1>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="card space-y-3">
            <div>
              <div className="text-xs text-ink-400 uppercase tracking-wider">📞</div>
              <a
                href={`tel:${PHONE.replace(/[^+\d]/g, '')}`}
                className="block mt-1 text-xl font-bold text-brand-600 hover:underline"
              >
                {PHONE}
              </a>
            </div>
            <div>
              <div className="text-xs text-ink-400 uppercase tracking-wider">✉️</div>
              <a
                href={`mailto:${t('page.contacts.email')}`}
                className="block mt-1 text-ink-900 hover:text-brand-600"
              >
                {t('page.contacts.email')}
              </a>
            </div>
            <div>
              <div className="text-xs text-ink-400 uppercase tracking-wider">📍</div>
              <p className="mt-1 text-ink-900">{t('page.contacts.address')}</p>
            </div>
            <div>
              <div className="text-xs text-ink-400 uppercase tracking-wider">🕒</div>
              <p className="mt-1 text-ink-900">{t('page.contacts.hours')}</p>
            </div>
          </div>

          <div className="card aspect-square md:aspect-auto md:min-h-[280px] flex items-center justify-center text-ink-400">
            <div className="text-center">
              <div className="text-6xl">🗺️</div>
              <div className="mt-2 text-sm">Карта появится позже (Leaflet + 2GIS)</div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
