'use client';

import Image from 'next/image';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';

type Audience = 'home' | 'business';

const SERVICES: Record<
  Audience,
  Array<{
    img: string;
    titleKey: string;
    from: string;
    icon: string;
  }>
> = {
  home: [
    {
      img: '/img/clean_living_room.png',
      titleKey: 'home.services.apartment',
      from: '12 750 ₸',
      icon: '🏢',
    },
    {
      img: '/img/service_cottage.jpg',
      titleKey: 'home.services.cottage',
      from: '18 000 ₸',
      icon: '🏡',
    },
    {
      img: '/img/service_house.jpg',
      titleKey: 'home.services.house',
      from: '15 500 ₸',
      icon: '🏠',
    },
  ],
  business: [
    {
      img: '/img/service_office.jpg',
      titleKey: 'home.services.office',
      from: '20 000 ₸',
      icon: '🏪',
    },
    {
      img: '/img/service_commercial.jpg',
      titleKey: 'home.services.commercial',
      from: '25 000 ₸',
      icon: '🏬',
    },
    {
      img: '/img/service_after_hours.jpg',
      titleKey: 'home.services.afterHours',
      from: '30 000 ₸',
      icon: '🌙',
    },
  ],
};

export function ServiceAudienceSection() {
  const t = useTranslations();
  const [audience, setAudience] = useState<Audience>('home');
  const services = SERVICES[audience];

  return (
    <>
      <section className="mx-auto mt-6 max-w-3xl px-4 md:px-6">
        <div className="flex rounded-pill bg-white p-1 shadow-soft">
          <AudienceButton
            active={audience === 'home'}
            onClick={() => setAudience('home')}
          >
            {t('home.audience.home')}
          </AudienceButton>
          <AudienceButton
            active={audience === 'business'}
            onClick={() => setAudience('business')}
          >
            {t('home.audience.business')}
          </AudienceButton>
        </div>
      </section>

      <section className="mx-auto mt-10 max-w-6xl px-4 md:px-6">
        <h2 className="section-title">{t('home.servicesTitle')}</h2>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 md:gap-4">
          {services.map((service) => (
            <ServiceCard
              key={service.titleKey}
              img={service.img}
              title={t(service.titleKey)}
              from={`${t('home.from')} ${service.from}`}
              icon={service.icon}
            />
          ))}
        </div>
      </section>
    </>
  );
}

function AudienceButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 rounded-pill py-2.5 text-sm font-semibold transition ${
        active
          ? 'bg-brand-600 text-white'
          : 'text-ink-700 hover:bg-brand-50'
      }`}
      aria-pressed={active}
    >
      {children}
    </button>
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
      className="group block overflow-hidden rounded-2xl bg-white shadow-soft transition hover:shadow-soft-md"
    >
      <div className="relative h-40 overflow-hidden md:h-44">
        <Image
          src={img}
          alt=""
          fill
          sizes="(max-width: 768px) 100vw, 33vw"
          className="object-cover transition group-hover:scale-105"
        />
      </div>
      <div className="p-3 md:p-4">
        <div className="text-sm font-semibold text-ink-900 md:text-base">
          {icon} {title}
        </div>
        <div className="mt-1 text-xs text-ink-400 md:text-sm">{from}</div>
      </div>
    </Link>
  );
}
