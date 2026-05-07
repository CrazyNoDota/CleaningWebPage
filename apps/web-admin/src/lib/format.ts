export function formatMoneyRu(minor: number, currency: string): string {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(minor / 100);
}

export function formatDateTimeRu(iso: string): string {
  return new Date(iso).toLocaleString('ru-RU', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

import type { OrderStatus } from './types';

export function statusLabel(s: OrderStatus): string {
  return {
    draft: 'Черновик',
    created: 'Создан',
    paid: 'Оплачен',
    assigned: 'Назначен',
    en_route: 'В пути',
    in_progress: 'Идёт уборка',
    done: 'Готово',
    reviewed: 'С отзывом',
    cancelled: 'Отменён',
  }[s];
}

export function statusBadgeClass(s: OrderStatus): string {
  switch (s) {
    case 'done':
    case 'reviewed':
      return 'badge-green';
    case 'in_progress':
    case 'en_route':
    case 'assigned':
      return 'badge-amber';
    case 'cancelled':
      return 'badge-red';
    default:
      return 'badge-slate';
  }
}
