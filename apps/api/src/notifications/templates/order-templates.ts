import type { Locale } from '../../common/locale';

/**
 * Inline templates keyed by domain event name + locale. Plain Handlebars-ish
 * `{{var}}` substitution — kept minimal so we don't ship a templating engine.
 *
 * When admins want to edit copy, swap to a DB-backed template store.
 */

export interface RenderedTemplate {
  subject?: string;
  body: string;
}

/**
 * Generic context bag for template interpolation. Any template can pull any
 * key — the renderer uses string conversion. Loosely typed on purpose so new
 * templates don't require touching this file's type.
 */
export type TemplateContext = Record<string, string | number | Date | null | undefined>;

/** @deprecated alias kept for the order listener; will be removed once stabilized */
export type OrderTemplateContext = TemplateContext;

type Template = {
  ru: { subject?: string; body: string };
  kk: { subject?: string; body: string };
  en: { subject?: string; body: string };
};

const TEMPLATES: Record<string, Template> = {
  'order.assigned': {
    ru: {
      subject: 'Уборщик назначен',
      body: 'Уборщик {{cleanerName}} назначен на ваш заказ. Подробности в приложении.',
    },
    kk: {
      subject: 'Тазалаушы тағайындалды',
      body: 'Тазалаушы {{cleanerName}} тапсырысыңызға тағайындалды. Толығырақ — қолданбада.',
    },
    en: {
      subject: 'Cleaner assigned',
      body: '{{cleanerName}} has been assigned to your order. See the app for details.',
    },
  },
  'order.en_route': {
    ru: {
      subject: 'Уборщик в пути',
      body: '{{cleanerName}} выехал к вам.',
    },
    kk: {
      subject: 'Тазалаушы жолда',
      body: '{{cleanerName}} сізге шықты.',
    },
    en: {
      subject: 'Cleaner on the way',
      body: '{{cleanerName}} is on the way.',
    },
  },
  'order.done': {
    ru: {
      subject: 'Уборка завершена',
      body: 'Уборка завершена. Пожалуйста, оцените работу.',
    },
    kk: {
      subject: 'Тазалау аяқталды',
      body: 'Тазалау аяқталды. Жұмысты бағалаңыз.',
    },
    en: {
      subject: 'Cleaning completed',
      body: 'Your cleaning is complete. Please rate the work.',
    },
  },
  'order.cancelled': {
    ru: {
      subject: 'Заказ отменён',
      body: 'Ваш заказ отменён. Если это ошибка — свяжитесь с поддержкой.',
    },
    kk: {
      subject: 'Тапсырыс жойылды',
      body: 'Тапсырысыңыз жойылды. Қате болса, қолдау қызметіне хабарласыңыз.',
    },
    en: {
      subject: 'Order cancelled',
      body: 'Your order has been cancelled. Contact support if this was a mistake.',
    },
  },
  'application.received': {
    ru: {
      subject: 'Новая заявка на работу',
      body: 'Новая заявка: {{fullName}} ({{phone}}), город — {{city}}.',
    },
    kk: {
      subject: 'Жаңа жұмыс өтінімі',
      body: 'Жаңа өтінім: {{fullName}} ({{phone}}), қала — {{city}}.',
    },
    en: {
      subject: 'New job application',
      body: 'New application: {{fullName}} ({{phone}}), city — {{city}}.',
    },
  },
};

export function renderOrderTemplate(
  eventType: string,
  locale: Locale,
  ctx: OrderTemplateContext,
): RenderedTemplate | null {
  const tpl = TEMPLATES[eventType];
  if (!tpl) return null;
  const localized = tpl[locale] ?? tpl.ru;
  return {
    subject: localized.subject ? interpolate(localized.subject, ctx) : undefined,
    body: interpolate(localized.body, ctx),
  };
}

function interpolate(s: string, ctx: OrderTemplateContext): string {
  return s.replace(/\{\{(\w+)\}\}/g, (_, key: string) => {
    const v = ctx[key as keyof OrderTemplateContext];
    if (v === undefined || v === null) return '';
    if (v instanceof Date) return v.toISOString();
    return String(v);
  });
}
