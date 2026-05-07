export type Locale = 'ru' | 'kk' | 'en';
export const SUPPORTED_LOCALES: readonly Locale[] = ['ru', 'kk', 'en'] as const;
export const DEFAULT_LOCALE: Locale = 'ru';

/**
 * Pick a locale from the standard request inputs:
 *   1. ?locale=xx query
 *   2. Accept-Language header (first matching tag)
 *   3. fallback to DEFAULT_LOCALE
 */
export function resolveLocale(query: string | undefined, acceptLanguage: string | undefined): Locale {
  if (query && (SUPPORTED_LOCALES as readonly string[]).includes(query)) {
    return query as Locale;
  }
  if (acceptLanguage) {
    for (const part of acceptLanguage.split(',')) {
      const tag = part.split(';')[0]?.trim().toLowerCase().slice(0, 2);
      if (tag && (SUPPORTED_LOCALES as readonly string[]).includes(tag)) {
        return tag as Locale;
      }
    }
  }
  return DEFAULT_LOCALE;
}

/** Pick the localized field from a row of shape { fieldRu, fieldKk, fieldEn } */
export function pickLocalized<T extends Record<string, unknown>>(
  row: T,
  field: string,
  locale: Locale,
): string {
  const suffix = locale.charAt(0).toUpperCase() + locale.slice(1);
  const key = `${field}${suffix}`;
  const v = row[key];
  if (typeof v === 'string') return v;
  // fall back to ru if the requested locale is missing
  const ru = row[`${field}Ru`];
  return typeof ru === 'string' ? ru : '';
}
