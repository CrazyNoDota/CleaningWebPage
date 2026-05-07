import type { Locale } from './types';

const localeToTag: Record<Locale, string> = {
  ru: 'ru-RU',
  kk: 'kk-KZ',
  en: 'en-US',
};

/**
 * Format a money amount stored in minor units (tiyin) as a localized string.
 */
export function formatMoney(minor: number, currency: string, locale: Locale): string {
  return new Intl.NumberFormat(localeToTag[locale], {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(minor / 100);
}
