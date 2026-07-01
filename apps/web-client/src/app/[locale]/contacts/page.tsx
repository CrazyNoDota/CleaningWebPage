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
                className="mt-1 block break-words text-xl font-bold text-brand-600 hover:underline"
              >
                {PHONE}
              </a>
            </div>
            <div>
              <div className="text-xs text-ink-400 uppercase tracking-wider">✉️</div>
              <a
                href={`mailto:${t('page.contacts.email')}`}
                className="mt-1 block break-words text-ink-900 hover:text-brand-600"
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

          <div className="card flex flex-col justify-between md:min-h-[280px]">
            <div className="space-y-3">
              <div className="text-xs text-ink-400 uppercase tracking-wider">
                {t('page.contacts.office')}
              </div>
              <p className="text-lg font-semibold text-ink-900">
                {t('page.contacts.address')}
              </p>
              <p className="text-ink-500">{t('page.contacts.hours')}</p>
            </div>
            <a
              href={`https://2gis.kz/astana/search/${encodeURIComponent(
                t('page.contacts.address'),
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-flex items-center justify-center rounded-xl bg-brand-600 px-4 py-3 font-semibold text-white transition hover:bg-brand-700"
            >
              {t('page.contacts.openIn2gis')}
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}
