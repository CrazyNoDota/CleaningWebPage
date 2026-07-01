import type { MetadataRoute } from 'next';
import { locales } from '@/i18n/config';

const SITE_URL = 'https://shinex.kz';

// Main public routes (relative to /{locale}); cabinet/auth pages are excluded.
const routes = [
  '',
  '/services',
  '/about',
  '/contacts',
  '/careers',
  '/book',
  '/privacy',
  '/terms',
] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return locales.flatMap((locale) =>
    routes.map((route) => ({
      url: `${SITE_URL}/${locale}${route}`,
      lastModified,
      changeFrequency: 'weekly' as const,
      priority: route === '' ? 1 : 0.7,
      alternates: {
        languages: Object.fromEntries(
          locales.map((alt) => [alt, `${SITE_URL}/${alt}${route}`]),
        ),
      },
    })),
  );
}
