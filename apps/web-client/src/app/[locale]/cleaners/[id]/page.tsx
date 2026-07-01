import Image from 'next/image';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import { SiteHeader } from '@/components/SiteHeader';
import { getCleaner, listCleanerReviews } from '@/lib/api';
import { demoCleanerReviews, demoCleaners } from '@/lib/demo-cleaners';
import type { CleanerCard, CleanerReview, Locale } from '@/lib/types';

export default async function CleanerProfilePage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();
  const cleaner = await loadCleaner(id, locale as Locale);
  if (!cleaner) notFound();

  const reviews = await loadReviews(id);

  return (
    <div className="min-h-screen bg-slate-50">
      <SiteHeader />
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-10">
        <Link href="/" className="text-sm font-semibold text-brand-600 hover:text-brand-700">
          {t('cleanerProfile.back')}
        </Link>

        <section className="mt-5 overflow-hidden rounded-2xl bg-white shadow-soft">
          <div className="relative h-80 sm:h-96">
            <Image
              src={cleaner.photoUrl ?? '/img/cleaner_profile_1.png'}
              alt={cleaner.displayName}
              fill
              priority
              sizes="(max-width: 768px) 100vw, 768px"
              className="object-cover object-top"
            />
          </div>
          <div className="p-5 sm:p-7">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h1 className="text-3xl font-extrabold text-ink-900">
                  {cleaner.displayName}
                </h1>
                <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-ink-400">
                  {cleaner.ratingCount > 0 ? (
                    <>
                      <Stars
                        rating={cleaner.ratingAvg}
                        ariaLabel={t('rating.summaryWithCount', {
                          avg: cleaner.ratingAvg.toFixed(1),
                          count: cleaner.ratingCount,
                        })}
                      />
                      <span>
                        {cleaner.ratingAvg.toFixed(1)} · {cleaner.ratingCount}{' '}
                        {t('cleanerProfile.reviews').toLowerCase()}
                      </span>
                    </>
                  ) : (
                    <span>{t('rating.none')}</span>
                  )}
                  {cleaner.verified && (
                    <span className="rounded-pill bg-brand-100 px-3 py-1 text-brand-700">
                      {t('cleanerProfile.verified')}
                    </span>
                  )}
                </div>
              </div>
              <Link href="/book" className="btn-primary text-center">
                {t('cleanerProfile.book')}
              </Link>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <Stat value={String(cleaner.yearsOfExperience)} label={t('home.stats.experience')} />
              <Stat
                value={String(cleaner.completedOrdersCount)}
                label={t('cleanerProfile.orders')}
              />
              <Stat value={cleaner.languages.join(', ').toUpperCase()} label={t('cleanerProfile.languages')} />
            </div>

            {cleaner.bio && (
              <section className="mt-7">
                <h2 className="text-lg font-bold text-ink-900">{t('cleanerProfile.about')}</h2>
                <p className="mt-2 text-base leading-7 text-ink-700">{cleaner.bio}</p>
              </section>
            )}

            {cleaner.specialization.length > 0 && (
              <section className="mt-7">
                <h2 className="text-lg font-bold text-ink-900">
                  {t('cleanerProfile.specialization')}
                </h2>
                <div className="mt-3 flex flex-wrap gap-2">
                  {cleaner.specialization.map((item) => (
                    <span key={item} className="pill">
                      {formatSpecialization(item, locale as Locale)}
                    </span>
                  ))}
                </div>
              </section>
            )}
          </div>
        </section>

        <section className="mt-8">
          <h2 className="section-title">{t('cleanerProfile.reviews')}</h2>
          {reviews.length === 0 ? (
            <p className="mt-3 rounded-2xl bg-white p-5 text-ink-400 shadow-soft">
              {t('cleanerProfile.noReviews')}
            </p>
          ) : (
            <div className="mt-4 space-y-3">
              {reviews.map((review) => (
                <ReviewCard
                  key={review.id}
                  review={review}
                  ratingLabel={t('rating.summary', { avg: String(review.rating) })}
                />
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

async function loadCleaner(id: string, locale: Locale): Promise<CleanerCard | null> {
  try {
    return await getCleaner(id, locale);
  } catch {
    return demoCleaners.find((cleaner) => cleaner.id === id) ?? null;
  }
}

async function loadReviews(id: string): Promise<CleanerReview[]> {
  try {
    return await listCleanerReviews(id, 20);
  } catch {
    return demoCleanerReviews[id] ?? [];
  }
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-center">
      <div className="text-2xl font-extrabold text-brand-600">{value}</div>
      <div className="mt-1 text-xs text-ink-400">{label}</div>
    </div>
  );
}

const STAR_SLOTS = [0, 1, 2, 3, 4];

function StarIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4 shrink-0" aria-hidden>
      <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
    </svg>
  );
}

/**
 * Accessible star rating: a consistent SVG glyph with fractional fill and a
 * numeric aria-label. Callers must guard the empty state (no reviews) and show
 * a localized "no rating" label instead of rendering this.
 */
function Stars({ rating, ariaLabel }: { rating: number; ariaLabel: string }) {
  const pct = (Math.max(0, Math.min(5, rating)) / 5) * 100;
  return (
    <span role="img" aria-label={ariaLabel} className="relative inline-flex leading-none">
      <span aria-hidden className="flex text-slate-300">
        {STAR_SLOTS.map((i) => (
          <StarIcon key={i} />
        ))}
      </span>
      <span
        aria-hidden
        className="absolute inset-y-0 left-0 flex overflow-hidden text-gold"
        style={{ width: `${pct}%` }}
      >
        {STAR_SLOTS.map((i) => (
          <StarIcon key={i} />
        ))}
      </span>
    </span>
  );
}

function ReviewCard({
  review,
  ratingLabel,
}: {
  review: CleanerReview;
  ratingLabel: string;
}) {
  return (
    <article className="rounded-2xl bg-white p-5 shadow-soft">
      <div className="flex items-center justify-between gap-3">
        <Stars rating={review.rating} ariaLabel={ratingLabel} />
        <time className="text-xs text-ink-400" dateTime={review.publishedAt ?? review.createdAt}>
          {formatDate(review.publishedAt ?? review.createdAt)}
        </time>
      </div>
      {review.comment && (
        <p className="mt-3 text-sm leading-6 text-ink-700">{review.comment}</p>
      )}
    </article>
  );
}

function formatSpecialization(value: string, locale: Locale): string {
  const labels: Record<Locale, Record<string, string>> = {
    ru: {
      apartment: 'Квартиры',
      deep: 'Генеральная уборка',
      house: 'Дома',
      office: 'Офисы',
      post_renovation: 'После ремонта',
    },
    kk: {
      apartment: 'Пәтерлер',
      deep: 'Жалпы тазалау',
      house: 'Үйлер',
      office: 'Кеңселер',
      post_renovation: 'Жөндеуден кейін',
    },
    en: {
      apartment: 'Apartments',
      deep: 'Deep cleaning',
      house: 'Houses',
      office: 'Offices',
      post_renovation: 'Post-renovation',
    },
  };
  return labels[locale]?.[value] ?? value;
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(new Date(value));
}
