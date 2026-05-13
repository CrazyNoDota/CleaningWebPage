'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { LocaleSwitcher } from './LocaleSwitcher';
import { useSession } from '@/lib/use-session';

const PHONE = '+7 (700) 301-84-05';

export function SiteHeader() {
  const t = useTranslations();
  const { session, hydrated, signOut } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="bg-white border-b border-slate-200">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 sm:px-6 md:py-4">
        <Link
          href="/"
          aria-label={`${t('brand.first')}${t('brand.second')}`}
          className="flex min-w-0 shrink-0 items-center"
          onClick={() => setMobileOpen(false)}
        >
          <Image
            src="/img/shinex-logo.png"
            alt={`${t('brand.first')}${t('brand.second')}`}
            width={56}
            height={56}
            priority
            className="size-12 rounded-xl object-cover shadow-soft sm:size-14"
          />
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

        <div className="ml-auto hidden items-center gap-3 md:flex">
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

        <div className="ml-auto flex items-center gap-2 md:hidden">
          <LocaleSwitcher />
          <button
            type="button"
            onClick={() => setMobileOpen((open) => !open)}
            className="inline-flex size-10 items-center justify-center rounded-lg border border-slate-200 text-ink-900"
            aria-label="Toggle navigation"
            aria-expanded={mobileOpen}
          >
            <span className="sr-only">Menu</span>
            <span className="flex flex-col gap-1.5">
              <span className="block h-0.5 w-5 rounded bg-current" />
              <span className="block h-0.5 w-5 rounded bg-current" />
              <span className="block h-0.5 w-5 rounded bg-current" />
            </span>
          </button>
        </div>
      </div>
      {mobileOpen && (
        <div className="border-t border-slate-200 bg-white px-4 py-4 shadow-soft md:hidden">
          <nav className="mx-auto grid max-w-6xl gap-2 text-sm font-medium text-ink-700">
            <Link href="/services" className="rounded-lg px-3 py-2 hover:bg-brand-50" onClick={() => setMobileOpen(false)}>
              {t('nav.services')}
            </Link>
            <Link href="/about" className="rounded-lg px-3 py-2 hover:bg-brand-50" onClick={() => setMobileOpen(false)}>
              {t('nav.about')}
            </Link>
            <Link href="/contacts" className="rounded-lg px-3 py-2 hover:bg-brand-50" onClick={() => setMobileOpen(false)}>
              {t('nav.contacts')}
            </Link>
            <Link href="/careers" className="rounded-lg px-3 py-2 hover:bg-brand-50" onClick={() => setMobileOpen(false)}>
              {t('nav.careers')}
            </Link>
            {hydrated && session ? (
              <>
                <Link href="/orders" className="rounded-lg px-3 py-2 hover:bg-brand-50" onClick={() => setMobileOpen(false)}>
                  {t('nav.myOrders')}
                </Link>
                <button
                  onClick={() => {
                    setMobileOpen(false);
                    signOut();
                  }}
                  className="rounded-lg px-3 py-2 text-left text-ink-400 hover:bg-slate-50 hover:text-ink-900"
                >
                  {t('nav.signOut')}
                </button>
              </>
            ) : (
              <Link href="/login" className="btn-primary mt-2 text-center" onClick={() => setMobileOpen(false)}>
                {t('nav.signIn')}
              </Link>
            )}
            <a
              href={`tel:${PHONE.replace(/[^+\d]/g, '')}`}
              className="rounded-lg px-3 py-2 text-ink-900 hover:bg-brand-50"
            >
              {PHONE}
            </a>
            <span className="pill w-fit">{t('nav.city')}</span>
          </nav>
        </div>
      )}
    </header>
  );
}
