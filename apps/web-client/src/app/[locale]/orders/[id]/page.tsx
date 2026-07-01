'use client';

import { useEffect, useMemo, useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useParams, useRouter } from 'next/navigation';
import { io, type Socket } from 'socket.io-client';
import { SiteHeader } from '@/components/SiteHeader';
import { ReviewForm, ReviewThanks } from '@/components/ReviewForm';
import {
  ApiError,
  WS_BASE,
  confirmStubPayment,
  getOrder,
  getOrderCleaner,
  initiatePayment,
} from '@/lib/api';
import { formatMoney } from '@/lib/format';
import { useSession } from '@/lib/use-session';
import type { CleanerCard, Locale, Order, OrderStatus } from '@/lib/types';

const STATUS_ORDER: OrderStatus[] = [
  'created',
  'paid',
  'assigned',
  'en_route',
  'in_progress',
  'done',
  'reviewed',
];

export default function OrderPage() {
  const t = useTranslations();
  const locale = useLocale() as Locale;
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const orderId = params.id;
  const { session, hydrated } = useSession();

  const [order, setOrder] = useState<Order | null>(null);
  const [cleaner, setCleaner] = useState<CleanerCard | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [liveBadge, setLiveBadge] = useState(false);
  const [paying, setPaying] = useState(false);

  // Redirect to login if not authed.
  useEffect(() => {
    if (hydrated && !session) {
      router.push(`/login?next=${encodeURIComponent(`/orders/${orderId}`)}`);
    }
  }, [hydrated, session, router, orderId]);

  // Initial fetches
  useEffect(() => {
    if (!session) return;
    getOrder(orderId)
      .then((o) => setOrder(o))
      .catch((e: ApiError) => setError(e.message));
    refreshCleaner();
    function refreshCleaner() {
      getOrderCleaner(orderId, locale)
        .then((res) => setCleaner(res.cleaner))
        .catch(() => {
          /* ignore — cleaner may not be assigned yet */
        });
    }
  }, [orderId, locale, session]);

  // WebSocket subscription
  useEffect(() => {
    if (!session) return;
    const sock: Socket = io(`${WS_BASE}/realtime`, {
      auth: { token: session.accessToken },
      transports: ['websocket'],
      reconnection: true,
    });

    sock.on('connect', () => {
      setLiveBadge(true);
      sock.emit('subscribe-order', { orderId });
    });

    sock.on('order.updated', (msg: { status: OrderStatus; eventType: string }) => {
      setOrder((prev) => (prev ? { ...prev, status: msg.status } : prev));
      // When a cleaner gets assigned, fetch their profile.
      if (msg.eventType === 'order.assigned') {
        getOrderCleaner(orderId, locale)
          .then((res) => setCleaner(res.cleaner))
          .catch(() => undefined);
      }
    });

    sock.on('disconnect', () => setLiveBadge(false));

    return () => {
      sock.disconnect();
    };
  }, [orderId, session, locale]);

  const stepIndex = useMemo(() => {
    if (!order) return -1;
    return STATUS_ORDER.indexOf(order.status);
  }, [order]);

  async function onPay() {
    if (!order) return;
    setPaying(true);
    setError(null);
    try {
      const payment = await initiatePayment(order.id, `web-${order.id}`);
      if (payment.nextAction === 'stub_confirm') {
        await confirmStubPayment(payment.id);
        const next = await getOrder(order.id);
        setOrder(next);
        return;
      }
      if (payment.paymentUrl) {
        window.location.href = payment.paymentUrl;
      }
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'payment failed');
    } finally {
      setPaying(false);
    }
  }

  if (!hydrated || !session) {
    return (
      <div className="min-h-screen flex flex-col">
        <SiteHeader />
        <main className="mx-auto w-full max-w-3xl flex-1 space-y-6 px-4 py-8 sm:px-6 sm:py-10">
          <h1 className="text-2xl font-bold text-slate-900">{t('order.title')}</h1>
          <OrderDetailSkeleton />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 space-y-6 px-4 py-8 sm:px-6 sm:py-10">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-bold text-slate-900">{t('order.title')}</h1>
          {liveBadge && (
            <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full">
              ● {t('order.live')}
            </span>
          )}
        </div>

        {error && (
          <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
        )}

        {!order && !error && <OrderDetailSkeleton />}

        {order && (
          <>
            <section className="card">
              <Row
                label={t('order.status')}
                value={t(`status.${order.status}`)}
                emphasize
              />
              <Row
                label={t('order.total')}
                value={formatMoney(order.total, order.currency, locale)}
              />
              {order.scheduledAt && (
                <Row
                  label={t('order.scheduledAt')}
                  value={new Date(order.scheduledAt).toLocaleString(localeTag(locale))}
                />
              )}
              {/* Status stepper */}
              <StatusStepper steps={STATUS_ORDER} currentIndex={stepIndex} />
              {order.status === 'created' && (
                <button
                  type="button"
                  onClick={onPay}
                  disabled={paying}
                  className="btn-primary mt-6 w-full sm:w-auto"
                >
                  {paying ? t('common.loading') : t('order.pay')}
                </button>
              )}
            </section>

            <section className="card">
              <h2 className="font-semibold text-slate-900">{t('order.yourCleaner')}</h2>
              {cleaner ? <CleanerCardView cleaner={cleaner} /> : (
                <p className="mt-2 text-sm text-slate-500">{t('order.noCleanerYet')}</p>
              )}
            </section>

            {order.status === 'done' && (
              <ReviewForm
                orderId={order.id}
                onSubmitted={() =>
                  setOrder((prev) => (prev ? { ...prev, status: 'reviewed' } : prev))
                }
              />
            )}
            {order.status === 'reviewed' && <ReviewThanks />}
          </>
        )}
      </main>
    </div>
  );
}

/**
 * Accessible order-status stepper. Renders larger progress segments that
 * distinguish completed / current / upcoming steps, a "Step N of M" counter,
 * and visible localized labels for the current + adjacent steps. Statuses
 * outside the happy path (draft / cancelled → currentIndex === -1) fall back
 * to a plain empty track.
 */
function StatusStepper({
  steps,
  currentIndex,
}: {
  steps: OrderStatus[];
  currentIndex: number;
}) {
  const t = useTranslations();
  const total = steps.length;
  const inFlow = currentIndex >= 0;
  const prev = inFlow && currentIndex > 0 ? steps[currentIndex - 1] : null;
  const current = inFlow ? steps[currentIndex] : null;
  const next = inFlow && currentIndex < total - 1 ? steps[currentIndex + 1] : null;

  return (
    <div className="mt-6">
      {inFlow && (
        <div className="flex items-center justify-end">
          <span className="text-xs font-medium text-slate-500">
            {t('order.stepIndicator', { current: currentIndex + 1, total })}
          </span>
        </div>
      )}

      <ol className="mt-2 flex items-center gap-1.5" aria-label={t('order.progress')}>
        {steps.map((s, i) => {
          const done = i < currentIndex;
          const isCurrent = i === currentIndex;
          return (
            <li
              key={s}
              className="flex-1"
              aria-current={isCurrent ? 'step' : undefined}
            >
              <span
                className={`block h-2.5 rounded-full transition-colors ${
                  done
                    ? 'bg-brand-600'
                    : isCurrent
                      ? 'bg-brand-600 ring-2 ring-brand-200'
                      : 'bg-slate-200'
                }`}
              />
              <span className="sr-only">{t(`status.${s}`)}</span>
            </li>
          );
        })}
      </ol>

      {inFlow && current && (
        <div className="mt-2 flex items-start justify-between gap-3 text-xs">
          <span className="flex-1 truncate text-slate-400">
            {prev ? t(`status.${prev}`) : ''}
          </span>
          <span className="flex-1 truncate text-center font-semibold text-brand-700">
            {t(`status.${current}`)}
          </span>
          <span className="flex-1 truncate text-right text-slate-400">
            {next ? t(`status.${next}`) : ''}
          </span>
        </div>
      )}
    </div>
  );
}

/** Greyed placeholder shown while the order is loading — keeps layout stable. */
function OrderDetailSkeleton() {
  const t = useTranslations();
  return (
    <div className="space-y-6" role="status" aria-label={t('common.loading')}>
      <section className="card animate-pulse space-y-4">
        <div className="flex items-baseline justify-between">
          <div className="h-4 w-20 rounded bg-slate-200" />
          <div className="h-5 w-32 rounded bg-slate-200" />
        </div>
        <div className="flex items-baseline justify-between">
          <div className="h-4 w-16 rounded bg-slate-200" />
          <div className="h-4 w-24 rounded bg-slate-200" />
        </div>
        <div className="mt-4 flex items-center gap-1.5">
          {Array.from({ length: STATUS_ORDER.length }).map((_, i) => (
            <div key={i} className="h-2.5 flex-1 rounded-full bg-slate-200" />
          ))}
        </div>
      </section>
      <section className="card animate-pulse">
        <div className="h-4 w-32 rounded bg-slate-200" />
        <div className="mt-4 flex items-center gap-4">
          <div className="size-16 shrink-0 rounded-full bg-slate-200" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-40 rounded bg-slate-200" />
            <div className="h-3 w-56 rounded bg-slate-100" />
          </div>
        </div>
      </section>
    </div>
  );
}

function CleanerCardView({ cleaner }: { cleaner: CleanerCard }) {
  const t = useTranslations();
  return (
    <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-start">
      <div className="flex size-16 shrink-0 items-center justify-center rounded-full bg-brand-100 text-2xl font-bold text-brand-700">
        {cleaner.displayName.charAt(0)}
      </div>
      <div className="flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <strong className="text-slate-900">{cleaner.displayName}</strong>
          {cleaner.verified && (
            <span className="text-xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full">
              ✓ {t('order.verified')}
            </span>
          )}
        </div>
        <p className="text-sm text-slate-500 mt-1">
          ★ {t('order.rating', {
            avg: cleaner.ratingAvg.toFixed(1),
            count: cleaner.ratingCount,
          })}
          {' · '}
          {t('order.experience', { years: cleaner.yearsOfExperience })}
        </p>
        {cleaner.bio && <p className="mt-2 text-sm text-slate-700">{cleaner.bio}</p>}
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  emphasize,
}: {
  label: string;
  value: string;
  emphasize?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1 py-2 sm:flex-row sm:items-baseline sm:justify-between">
      <dt className="text-sm text-slate-500">{label}</dt>
      <dd
        className={
          emphasize
            ? 'break-words font-bold text-slate-900 sm:text-right text-lg'
            : 'break-words font-medium text-slate-900 sm:text-right text-sm'
        }
      >
        {value}
      </dd>
    </div>
  );
}

function localeTag(l: Locale): string {
  return ({ ru: 'ru-RU', kk: 'kk-KZ', en: 'en-US' } as const)[l];
}
