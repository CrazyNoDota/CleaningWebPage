import type { Metadata } from 'next';
import localFont from 'next/font/local';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { locales, type Locale } from '@/i18n/config';
import '../globals.css';

// Self-hosted Inter (variable font, incl. Cyrillic) vendored into the repo so
// `next build` never reaches out to Google Fonts — hermetic, network-independent build.
const inter = localFont({
  src: '../fonts/InterVariable.woff2',
  weight: '100 900',
  display: 'swap',
  variable: '--font-inter',
});

const SITE_URL = 'https://shinex.kz';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  setRequestLocale(locale as Locale);
  const t = await getTranslations();
  const tagline = t('common.tagline');
  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default: `Shinex — ${tagline}`,
      template: '%s · Shinex',
    },
    description: tagline,
    // NOTE: no `alternates.languages` here — this layout is shared by every
    // nested route and only receives `locale` (not the pathname), so it can't
    // emit route-correct hreflang links. Per-route hreflang alternates are
    // emitted by sitemap.ts instead.
  };
}

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!(locales as readonly string[]).includes(locale)) notFound();
  setRequestLocale(locale as Locale);

  const messages = await getMessages();

  return (
    <html lang={locale} className={inter.variable}>
      <body className="min-h-screen antialiased font-sans">
        <NextIntlClientProvider locale={locale} messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
