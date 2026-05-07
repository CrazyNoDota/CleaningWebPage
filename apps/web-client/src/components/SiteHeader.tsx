'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { LocaleSwitcher } from './LocaleSwitcher';
import { useSession } from '@/lib/use-session';

export function SiteHeader() {
  const t = useTranslations();
  const { session, hydrated, signOut } = useSession();

  return (
    <header className="border-b border-slate-200">
      <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold text-brand-600">
          {t('common.brand')}
        </Link>
        <nav className="hidden md:flex gap-6 text-sm text-slate-600">
          <Link href="/book" className="hover:text-brand-600">
            {t('nav.book')}
          </Link>
        </nav>
        <div className="flex items-center gap-3">
          <LocaleSwitcher />
          {hydrated && session ? (
            <button
              onClick={signOut}
              className="text-sm text-slate-600 hover:text-slate-900"
            >
              {t('nav.signOut')}
            </button>
          ) : (
            <Link
              href="/login"
              className="text-sm rounded-lg bg-brand-600 px-4 py-2 text-white hover:bg-brand-700"
            >
              {t('nav.signIn')}
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
