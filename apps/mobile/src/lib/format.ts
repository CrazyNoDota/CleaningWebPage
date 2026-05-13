import type { Locale, OrderStatus } from './types';

export function formatMoney(amountMinor: number, currency = 'KZT', locale: Locale = 'ru') {
  return new Intl.NumberFormat(localeTag(locale), {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amountMinor / 100);
}

export function localeTag(locale: Locale) {
  return ({ ru: 'ru-RU', kk: 'kk-KZ', en: 'en-US' } as const)[locale];
}

export function statusLabel(status: OrderStatus) {
  return {
    draft: 'Черновик',
    created: 'Создан',
    paid: 'Оплачен',
    assigned: 'Назначен',
    en_route: 'В пути',
    in_progress: 'В работе',
    done: 'Готово',
    reviewed: 'Отзыв оставлен',
    cancelled: 'Отменен',
  }[status];
}

export function defaultScheduleInput() {
  return toScheduleInput(buildScheduleOptions()[0].value);
}

export function scheduleInputToIso(value: string) {
  const trimmed = value.trim().replace(' ', 'T');
  const date = new Date(trimmed);
  if (Number.isNaN(date.getTime())) {
    throw new Error('Введите дату в формате YYYY-MM-DD HH:mm');
  }
  return date.toISOString();
}

export function toScheduleInput(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}`;
}

export function buildScheduleOptions(now = new Date()) {
  const slots: Array<{ label: string; value: Date }> = [];
  const days = [
    { offset: 1, label: 'Завтра' },
    { offset: 2, label: 'Послезавтра' },
    { offset: 3, label: weekdayLabel(addDays(now, 3)) },
  ];
  const hours = [10, 13, 16, 19];

  for (const day of days) {
    for (const hour of hours) {
      const value = addDays(now, day.offset);
      value.setHours(hour, 0, 0, 0);
      slots.push({ label: `${day.label}, ${pad(hour)}:00`, value });
    }
  }

  return slots;
}

export function formatAddress(address: {
  street: string;
  building: string;
  apartment?: string | null;
}) {
  const apartment = address.apartment ? `, кв. ${address.apartment}` : '';
  return `${address.street}, ${address.building}${apartment}`;
}

function addDays(date: Date, days: number) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

function weekdayLabel(date: Date) {
  return date.toLocaleDateString(localeTag('ru'), {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}

function pad(n: number) {
  return String(n).padStart(2, '0');
}
