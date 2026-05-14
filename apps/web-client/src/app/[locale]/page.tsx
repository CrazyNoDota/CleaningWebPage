import Image from 'next/image';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import { SiteHeader } from '@/components/SiteHeader';
import { ServiceAudienceSection } from '@/components/ServiceAudienceSection';
import { listCleaners } from '@/lib/api';
import { demoCleaners } from '@/lib/demo-cleaners';
import type { CleanerCard as CleanerCardModel, Locale } from '@/lib/types';

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();
  const featuredCleaners = await getFeaturedCleaners(locale as Locale);

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />

      <main className="flex-1">
        {/* HERO */}
        <section className="mx-auto mt-4 max-w-6xl px-4 md:mt-6 md:px-6">
          <div className="relative h-[320px] overflow-hidden rounded-2xl sm:h-[340px] md:h-[400px] md:rounded-3xl">
            <Image
              src="/img/cleaner_hero.png"
              alt=""
              fill
              priority
              sizes="(max-width: 768px) 100vw, 1024px"
              className="object-cover"
            />
            <div
              className="absolute inset-0 flex items-end p-5 sm:p-6 md:items-center md:p-12"
              style={{
                background:
                  'linear-gradient(135deg, rgba(0,107,159,0.85), rgba(36,214,198,0.55))',
              }}
            >
              <div className="max-w-xl text-white">
                <h1 className="text-3xl font-extrabold leading-tight sm:text-4xl md:text-5xl">
                  {t('home.heroTitle')}
                </h1>
                <p className="mt-3 max-w-prose text-base text-white/90 md:text-lg">
                  {t('home.heroSubtitle')}
                </p>
                <Link
                  href="/book"
                  className="mt-6 inline-flex max-w-full items-center justify-center rounded-pill bg-white px-6 py-3 text-center font-semibold text-brand-600 shadow-soft-md transition hover:bg-brand-50"
                >
                  {t('home.heroCta')}
                </Link>
              </div>
            </div>
          </div>
        </section>

        <ServiceAudienceSection />

        {/* ROOMS GRID */}
        <section className="mx-auto max-w-6xl px-4 md:px-6 mt-10">
          <h2 className="section-title">{t('home.roomsTitle')}</h2>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-4 md:gap-4">
            <RoomTile img="/img/room_living.jpg" label={t('home.rooms.living')} />
            <RoomTile img="/img/room_bedroom.jpg" label={t('home.rooms.bedroom')} />
            <RoomTile img="/img/room_kitchen.jpg" label={t('home.rooms.kitchen')} />
            <RoomTile img="/img/room_bathroom.jpg" label={t('home.rooms.bathroom')} />
          </div>
        </section>

        {/* PRICING TIERS */}
        <section className="mx-auto max-w-6xl px-4 md:px-6 mt-10">
          <h2 className="section-title">{t('home.pricingTitle')}</h2>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <PricingCard
              name={t('home.pricing.maintenance.name')}
              price="12 750 ₸"
              perVisit={t('home.pricing.perVisit')}
              desc={t('home.pricing.maintenance.desc')}
              items={t('home.pricing.maintenance.items')}
              cta={t('home.pricing.order')}
            />
            <PricingCard
              featured
              name={`⭐ ${t('home.pricing.deep.name')}`}
              price="27 119 ₸"
              perVisit={t('home.pricing.perVisit')}
              desc={t('home.pricing.deep.desc')}
              items={t('home.pricing.deep.items')}
              cta={t('home.pricing.order')}
            />
            <PricingCard
              name={t('home.pricing.renovation.name')}
              price="43 500 ₸"
              perVisit={t('home.pricing.perVisit')}
              desc={t('home.pricing.renovation.desc')}
              items={t('home.pricing.renovation.items')}
              cta={t('home.pricing.order')}
            />
          </div>
        </section>

        {/* WHY US */}
        <section className="mx-auto max-w-6xl px-4 md:px-6 mt-10">
          <h2 className="section-title">{t('home.whyTitle')}</h2>
          <div className="mt-6 grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-2 md:grid-cols-4">
            <WhyItem icon="🛡️" title={t('home.why.safety.title')} body={t('home.why.safety.body')} />
            <WhyItem icon="✨" title={t('home.why.quality.title')} body={t('home.why.quality.body')} />
            <WhyItem icon="⚡" title={t('home.why.convenience.title')} body={t('home.why.convenience.body')} />
            <WhyItem icon="💚" title={t('home.why.service.title')} body={t('home.why.service.body')} />
          </div>
        </section>

        {/* TOP CLEANERS */}
        <section className="mx-auto max-w-6xl px-4 md:px-6 mt-10">
          <h2 className="section-title">{t('home.cleanersTitle')}</h2>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 md:gap-4">
            {featuredCleaners.map((cleaner) => (
              <CleanerCard
                key={cleaner.id}
                cleaner={cleaner}
                experienceLabel={t('home.experienceYears', {
                  years: cleaner.yearsOfExperience,
                })}
              />
            ))}
          </div>
        </section>

        {/* APP PROMO */}
        <section className="mx-auto max-w-6xl px-4 md:px-6 mt-10">
          <div className="flex flex-col items-start gap-4 rounded-2xl bg-gradient-to-r from-brand-600 to-brand-400 p-6 text-white md:flex-row md:items-center md:gap-8 md:p-10">
            <div className="flex-1">
              <h3 className="text-xl md:text-2xl font-bold">📱 {t('home.appPromo.title')}</h3>
              <p className="mt-1 text-white/90">{t('home.appPromo.body')}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="rounded-pill bg-white/20 px-4 py-2 text-sm font-semibold">
                {t('home.appPromo.androidBadge')}
              </span>
              <span className="rounded-pill bg-white/20 px-4 py-2 text-sm font-semibold">
                {t('home.appPromo.iosBadge')}
              </span>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="mt-16">
        {/* Brand panel — dark surface lets the logo's glow blend naturally */}
        <div className="bg-ink-900 text-white">
          <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 px-6 py-12 text-center md:flex-row md:items-center md:gap-10 md:text-left">
            <Image
              src="/img/shinex-logo.png"
              alt={`${t('brand.first')}${t('brand.second')}`}
              width={192}
              height={192}
              className="size-36 rounded-3xl object-contain md:size-44"
            />
            <div className="max-w-md">
              <p className="text-xl font-bold leading-snug md:text-2xl">
                {t('home.heroTitle')}
              </p>
              <p className="mt-3 text-sm text-white/70 md:text-base">
                {t('home.heroSubtitle')}
              </p>
            </div>
          </div>
        </div>
        {/* Legal & info strip — light */}
        <div className="bg-white border-t border-slate-200">
          <div className="mx-auto max-w-6xl px-6 py-6 text-sm text-ink-400">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs">
                <Link href="/" className="hover:text-brand-600">
                  {t('footer.agreement')}
                </Link>
                <Link href="/" className="hover:text-brand-600">
                  {t('footer.privacy')}
                </Link>
                <Link href="/" className="hover:text-brand-600">
                  {t('footer.subscriptionRules')}
                </Link>
              </div>
              <div className="flex flex-col gap-2 text-xs sm:flex-row sm:items-center sm:gap-6">
                <span>© 2026 — Астана</span>
                <span>{t('footer.hours')}</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

// ── pieces ─────────────────────────────────────────────────────────

function RoomTile({ img, label }: { img: string; label: string }) {
  return (
    <div className="relative h-32 md:h-44 rounded-2xl overflow-hidden">
      <Image src={img} alt="" fill sizes="(max-width: 768px) 50vw, 25vw" className="object-cover" />
      <span className="absolute top-3 left-3 rounded-pill bg-black/55 text-white text-xs font-semibold px-3 py-1">
        {label}
      </span>
    </div>
  );
}

function PricingCard({
  name,
  price,
  perVisit,
  desc,
  items,
  cta,
  featured,
}: {
  name: string;
  price: string;
  perVisit: string;
  desc: string;
  items: string;
  cta: string;
  featured?: boolean;
}) {
  return (
    <div
      className={`relative rounded-2xl bg-white p-6 border ${
        featured
          ? 'border-brand-600 shadow-soft-md ring-1 ring-brand-600'
          : 'border-slate-200 shadow-soft'
      }`}
    >
      <h3 className="text-lg font-bold text-ink-900">{name}</h3>
      <div className="mt-2 text-2xl font-extrabold text-brand-600">
        {price}{' '}
        <span className="text-sm font-normal text-ink-400">{perVisit}</span>
      </div>
      <p className="mt-2 text-sm text-ink-700">{desc}</p>
      <ul className="mt-3 space-y-1.5">
        {items.split(' · ').map((it) => (
          <li key={it} className="text-sm text-ink-700 flex items-start gap-2">
            <span className="text-brand-400 font-bold">✓</span>
            <span>{it}</span>
          </li>
        ))}
      </ul>
      <Link
        href="/book"
        className="mt-5 block text-center rounded-pill border-2 border-brand-600 text-brand-600 py-2 font-semibold hover:bg-brand-600 hover:text-white transition"
      >
        {cta}
      </Link>
    </div>
  );
}

function WhyItem({ icon, title, body }: { icon: string; title: string; body: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="text-2xl leading-none shrink-0" aria-hidden>
        {icon}
      </span>
      <div>
        <h4 className="font-bold text-ink-900">{title}</h4>
        <p className="mt-1 text-sm text-ink-700 leading-relaxed">{body}</p>
      </div>
    </div>
  );
}

function CleanerCard({
  cleaner,
  experienceLabel,
}: {
  cleaner: CleanerCardModel;
  experienceLabel: string;
}) {
  return (
    <Link
      href={`/cleaners/${cleaner.id}`}
      className="block overflow-hidden rounded-2xl bg-white text-center shadow-soft transition hover:shadow-soft-md"
    >
      <div className="relative h-44 md:h-56">
        <Image
          src={cleaner.photoUrl ?? '/img/cleaner_profile_1.png'}
          alt={cleaner.displayName}
          fill
          sizes="(max-width: 768px) 100vw, 33vw"
          className="object-cover"
        />
      </div>
      <div className="p-3 md:p-4">
        <div className="font-bold text-ink-900">{cleaner.displayName}</div>
        <div className="text-sm text-gold">
          {'★'.repeat(Math.round(cleaner.ratingAvg || 5)).padEnd(5, '☆')}
        </div>
        <div className="mt-1 text-xs text-ink-400">{experienceLabel}</div>
      </div>
    </Link>
  );
}

async function getFeaturedCleaners(locale: Locale): Promise<CleanerCardModel[]> {
  try {
    const cleaners = await Promise.race([
      listCleaners(locale, 3),
      new Promise<CleanerCardModel[]>((resolve) => {
        setTimeout(() => resolve([]), 1200);
      }),
    ]);
    return cleaners.length > 0 ? cleaners : demoCleaners;
  } catch {
    return demoCleaners;
  }
}
