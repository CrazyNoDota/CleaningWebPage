'use client';

import { useEffect, useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import { Link } from '@/i18n/routing';
import { SiteHeader } from '@/components/SiteHeader';
import { ApiError, listOrders } from '@/lib/api';
import { formatMoney } from '@/lib/format';
import { useSession } from '@/lib/use-session';
import type { Locale, Order, OrderStatus } from '@/lib/types';

const ACTIVE: OrderStatus[] = [
  'created',
  'paid',
  'assigned',
  'en_route',
  'in_progress',
];

function statusBadgeClass(s: OrderStatus): string {
  if (ACTIVE.includes(s)) return 'bg-amber-50 text-amber-700';
  if (s === 'done' || s === 'reviewed') return 'bg-emerald-50 text-emerald-700';
  if (s === 'cancelled') return 'bg-red-50 text-red-700';
  return 'bg-slate-100 text-slate-700';
}

export default function OrdersListPage() {
  const t = useTranslations();
  const locale = useLocale() as Locale;
  const router = useRouter();
  const { session, hydrated } = useSession();
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!hydrated) return;
    if (!session) {
      router.push(`/login?next=${encodeURIComponent('/orders')}`);
      return;
    }
    listOrders()
      .then(setOrders)
      .catch((e: ApiError) => setError(e.message));
  }, [hydrated, session, router]);

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:px-6 sm:py-10">
        <h1 className="text-2xl font-bold text-slate-900">{t('orders.title')}</h1>
        <p className="mt-1 text-sm text-slate-500">{t('orders.intro')}</p>

        {error && (
          <p className="mt-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        )}

        {orders === null && !error && (
          <p className="mt-8 text-sm text-slate-500">{t('common.loading')}</p>
        )}

        {orders?.length === 0 && (
          <div className="mt-8 card text-center">
            <p className="text-slate-600">{t('orders.empty')}</p>
            <Link href="/book" className="btn-primary mt-4 inline-block">
              {t('orders.bookCta')}
            </Link>
          </div>
        )}

        {orders && orders.length > 0 && (
          <ul className="mt-6 space-y-3">
            {orders.map((o) => (
              <li key={o.id}>
                <Link
                  href={`/orders/${o.id}`}
                  className="card flex flex-col gap-2 hover:border-brand-600 transition-colors sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusBadgeClass(o.status)}`}
                      >
                        {t(`status.${o.status}`)}
                      </span>
                      <span className="text-xs text-slate-400">
                        {new Date(o.createdAt).toLocaleDateString(localeTag(locale))}
                      </span>
                    </div>
                    {o.scheduledAt && (
                      <div className="mt-1 text-sm text-slate-700">
                        {new Date(o.scheduledAt).toLocaleString(localeTag(locale), {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        })}
                      </div>
                    )}
                    {o.notes && (
                      <p className="mt-1 text-xs text-slate-500 line-clamp-1">
                        {o.notes}
                      </p>
                    )}
                  </div>
                  <div className="shrink-0 text-left sm:text-right">
                    <div className="text-lg font-semibold text-slate-900 tabular-nums">
                      {formatMoney(o.total, o.currency, locale)}
                    </div>
                    <div className="text-xs text-slate-400">
                      #{o.id.slice(0, 8)}
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}

function localeTag(l: Locale): string {
  return ({ ru: 'ru-RU', kk: 'kk-KZ', en: 'en-US' } as const)[l];
}
