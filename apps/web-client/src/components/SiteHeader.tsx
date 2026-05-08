'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { LocaleSwitcher } from './LocaleSwitcher';
import { useSession } from '@/lib/use-session';

const PHONE = '+7 (700) 301-84-05';

export function SiteHeader() {
  const t = useTranslations();
  const { session, hydrated, signOut } = useSession();

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="mx-auto max-w-6xl px-6 py-4 flex items-center gap-4">
        <Link href="/" className="text-2xl font-extrabold text-brand-600 tracking-tight">
          {t('brand.first')}
          <span className="text-brand-400">{t('brand.second')}</span>
        </Link>

        <nav className="hidden md:flex items-center gap-5 text-sm text-ink-700 ml-6">
          <Link href="/services" className="hover:text-brand-600 transition">
            {t('nav.services')}
          </Link>
          <Link href="/about" className="hover:text-brand-600 transition">
            {t('nav.about')}
          </Link>
          <Link href="/contacts" className="hover:text-brand-600 transition">
            {t('nav.contacts')}
          </Link>
          <Link href="/careers" className="hover:text-brand-600 transition">
            {t('nav.careers')}
          </Link>
        </nav>

        <div className="ml-auto flex items-center gap-3">
          <a
            href={`tel:${PHONE.replace(/[^+\d]/g, '')}`}
            className="hidden lg:inline text-sm font-semibold text-ink-900 hover:text-brand-600"
          >
            📞 {PHONE}
          </a>
          <span className="hidden md:inline pill">📍 {t('nav.city')}</span>
          <LocaleSwitcher />
          {hydrated && session ? (
            <>
              <Link
                href="/orders"
                className="text-sm text-ink-700 hover:text-brand-600 hidden md:inline"
              >
                {t('nav.myOrders')}
              </Link>
              <div className="size-9 rounded-full bg-brand-600 text-white text-sm font-semibold flex items-center justify-center">
                {(session.user.name ?? session.user.phone ?? '?').slice(0, 1).toUpperCase()}
              </div>
              <button
                onClick={signOut}
                className="text-sm text-ink-400 hover:text-ink-900"
              >
                {t('nav.signOut')}
              </button>
            </>
          ) : (
            <Link href="/login" className="btn-primary !py-2 !px-4 text-sm">
              {t('nav.signIn')}
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
