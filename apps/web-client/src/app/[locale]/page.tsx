import Image from 'next/image';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import { SiteHeader } from '@/components/SiteHeader';

export default async function HomePage({
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

      <main className="flex-1">
        {/* HERO */}
        <section className="mx-auto max-w-6xl px-4 md:px-6 mt-4 md:mt-6">
          <div className="relative overflow-hidden rounded-2xl md:rounded-3xl h-[260px] md:h-[400px]">
            <Image
              src="/img/cleaner_hero.png"
              alt=""
              fill
              priority
              sizes="(max-width: 768px) 100vw, 1024px"
              className="object-cover"
            />
            <div
              className="absolute inset-0 flex items-end md:items-center p-6 md:p-12"
              style={{
                background:
                  'linear-gradient(135deg, rgba(45,106,79,0.85), rgba(82,183,136,0.55))',
              }}
            >
              <div className="max-w-xl text-white">
                <h1 className="text-3xl md:text-5xl font-extrabold leading-tight">
                  {t('home.heroTitle')}
                </h1>
                <p className="mt-3 text-base md:text-lg text-white/90">
                  {t('home.heroSubtitle')}
                </p>
                <Link
                  href="/book"
                  className="mt-6 inline-block rounded-pill bg-white text-brand-600 font-semibold px-7 py-3 shadow-soft-md hover:bg-brand-50 transition"
                >
                  {t('home.heroCta')}
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* STATS BAR */}
        <section className="mx-auto max-w-6xl px-4 md:px-6 mt-4 md:mt-6 grid grid-cols-3 gap-2 md:gap-4">
          <Stat value="8 лет" label={t('home.stats.experience')} />
          <Stat value="1 000+" label={t('home.stats.cleaners')} />
          <Stat value="до 15%" label={t('home.stats.discount')} />
        </section>

        {/* AUDIENCE TOGGLE */}
        <section className="mx-auto max-w-3xl px-4 md:px-6 mt-6">
          <div className="flex bg-white rounded-pill p-1 shadow-soft">
            <button className="flex-1 py-2.5 text-sm font-semibold rounded-pill bg-brand-600 text-white">
              {t('home.audience.home')}
            </button>
            <button className="flex-1 py-2.5 text-sm font-semibold rounded-pill text-ink-700 hover:bg-brand-50 transition">
              {t('home.audience.business')}
            </button>
          </div>
        </section>

        {/* INSURANCE BADGE */}
        <section className="mx-auto max-w-3xl px-4 md:px-6 mt-4">
          <div className="flex items-center gap-3 rounded-2xl bg-brand-50 border border-brand-100 px-4 py-3 text-sm text-ink-700">
            <span className="text-2xl">🛡️</span>
            <span>{t('home.insurance')}</span>
          </div>
        </section>

        {/* SERVICES */}
        <section className="mx-auto max-w-6xl px-4 md:px-6 mt-10">
          <h2 className="section-title">{t('home.servicesTitle')}</h2>
          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            <ServiceCard
              img="/img/clean_living_room.png"
              title={t('home.services.apartment')}
              from={`${t('home.from')} 12 750 ₸`}
              icon="🏢"
            />
            <ServiceCard
              img="/img/clean_bedroom.png"
              title={t('home.services.cottage')}
              from={`${t('home.from')} 18 000 ₸`}
              icon="🏡"
            />
            <ServiceCard
              img="/img/clean_kitchen.png"
              title={t('home.services.house')}
              from={`${t('home.from')} 15 500 ₸`}
              icon="🏠"
            />
            <ServiceCard
              img="/img/clean_bathroom.png"
              title={t('home.services.office')}
              from={`${t('home.from')} 20 000 ₸`}
              icon="🏪"
            />
          </div>
        </section>

        {/* ROOMS GRID */}
        <section className="mx-auto max-w-6xl px-4 md:px-6 mt-10">
          <h2 className="section-title">{t('home.roomsTitle')}</h2>
          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            <RoomTile img="/img/clean_living_room.png" label={t('home.rooms.living')} />
            <RoomTile img="/img/clean_bedroom.png" label={t('home.rooms.bedroom')} />
            <RoomTile img="/img/clean_kitchen.png" label={t('home.rooms.kitchen')} />
            <RoomTile img="/img/clean_bathroom.png" label={t('home.rooms.bathroom')} />
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
          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            <WhyCard icon="🛡️" title={t('home.why.safety.title')} body={t('home.why.safety.body')} />
            <WhyCard icon="✨" title={t('home.why.quality.title')} body={t('home.why.quality.body')} />
            <WhyCard icon="⚡" title={t('home.why.convenience.title')} body={t('home.why.convenience.body')} />
            <WhyCard icon="💚" title={t('home.why.service.title')} body={t('home.why.service.body')} />
          </div>
        </section>

        {/* TOP CLEANERS */}
        <section className="mx-auto max-w-6xl px-4 md:px-6 mt-10">
          <h2 className="section-title">{t('home.cleanersTitle')}</h2>
          <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
            <CleanerCard img="/img/cleaner_profile_1.png" name="Гульзира" experienceLabel={t('home.experienceYears', { years: 6 })} />
            <CleanerCard img="/img/cleaner_profile_2.png" name="Лилия" experienceLabel={t('home.experienceYears', { years: 5 })} />
            <CleanerCard img="/img/cleaner_profile_3.png" name="Гульназ" experienceLabel={t('home.experienceYears', { years: 7 })} />
          </div>
        </section>

        {/* APP PROMO */}
        <section className="mx-auto max-w-6xl px-4 md:px-6 mt-10">
          <div className="rounded-2xl bg-gradient-to-r from-brand-600 to-brand-400 text-white p-6 md:p-10 flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-8">
            <div className="flex-1">
              <h3 className="text-xl md:text-2xl font-bold">📱 {t('home.appPromo.title')}</h3>
              <p className="mt-1 text-white/90">{t('home.appPromo.body')}</p>
            </div>
            <div className="flex gap-2">
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
      <footer className="mt-16 bg-white border-t border-slate-200">
        <div className="mx-auto max-w-6xl px-6 py-8 text-sm text-ink-400">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="font-extrabold text-brand-600 text-lg">
              {t('brand.first')}
              <span className="text-brand-400">{t('brand.second')}</span>
            </div>
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
          </div>
          <div className="mt-4 flex justify-between text-xs">
            <span>© 2026 — Астана</span>
            <span>{t('footer.hours')}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

// ── pieces ─────────────────────────────────────────────────────────

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-2xl bg-white p-4 md:p-5 text-center shadow-soft">
      <div className="text-xl md:text-2xl font-extrabold text-brand-600">{value}</div>
      <div className="mt-1 text-xs md:text-sm text-ink-400">{label}</div>
    </div>
  );
}

function ServiceCard({
  img,
  title,
  from,
  icon,
}: {
  img: string;
  title: string;
  from: string;
  icon: string;
}) {
  return (
    <Link
      href="/book"
      className="group block rounded-2xl bg-white shadow-soft hover:shadow-soft-md transition overflow-hidden"
    >
      <div className="relative h-32 md:h-36 overflow-hidden">
        <Image
          src={img}
          alt=""
          fill
          sizes="(max-width: 768px) 50vw, 25vw"
          className="object-cover group-hover:scale-105 transition"
        />
      </div>
      <div className="p-3 md:p-4">
        <div className="font-semibold text-ink-900 text-sm md:text-base">
          {icon} {title}
        </div>
        <div className="mt-1 text-xs md:text-sm text-ink-400">{from}</div>
      </div>
    </Link>
  );
}

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
      className={`rounded-2xl bg-white p-6 shadow-soft border-l-4 ${
        featured ? 'border-gold' : 'border-brand-400'
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

function WhyCard({ icon, title, body }: { icon: string; title: string; body: string }) {
  return (
    <div className="rounded-2xl bg-white p-5 text-center shadow-soft">
      <div className="text-3xl">{icon}</div>
      <h4 className="mt-2 font-bold text-brand-600">{title}</h4>
      <p className="mt-1 text-xs md:text-sm text-ink-400 leading-relaxed">{body}</p>
    </div>
  );
}

function CleanerCard({
  img,
  name,
  experienceLabel,
}: {
  img: string;
  name: string;
  experienceLabel: string;
}) {
  return (
    <div className="rounded-2xl bg-white shadow-soft overflow-hidden text-center">
      <div className="relative h-44 md:h-56">
        <Image src={img} alt={name} fill sizes="(max-width: 768px) 50vw, 33vw" className="object-cover" />
      </div>
      <div className="p-3 md:p-4">
        <div className="font-bold text-ink-900">{name}</div>
        <div className="text-gold text-sm">★★★★★</div>
        <div className="mt-1 text-xs text-ink-400">{experienceLabel}</div>
      </div>
    </div>
  );
}
