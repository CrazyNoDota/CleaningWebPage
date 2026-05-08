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

import type {
  JobApplicationStatusValue,
  OrderStatus,
  ReviewStatusValue,
} from './types';

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

export function reviewStatusLabel(s: ReviewStatusValue): string {
  return {
    pending: 'На модерации',
    published: 'Опубликован',
    hidden: 'Скрыт',
    rejected: 'Отклонён',
  }[s];
}

export function reviewStatusBadgeClass(s: ReviewStatusValue): string {
  switch (s) {
    case 'published':
      return 'badge-green';
    case 'pending':
      return 'badge-amber';
    case 'rejected':
      return 'badge-red';
    default:
      return 'badge-slate';
  }
}

export function applicationStatusLabel(s: JobApplicationStatusValue): string {
  return {
    new: 'Новая',
    contacted: 'Связались',
    interviewing: 'Интервью',
    hired: 'Принята',
    rejected: 'Отклонена',
  }[s];
}

export function applicationStatusBadgeClass(s: JobApplicationStatusValue): string {
  switch (s) {
    case 'hired':
      return 'badge-green';
    case 'contacted':
    case 'interviewing':
      return 'badge-amber';
    case 'rejected':
      return 'badge-red';
    default:
      return 'badge-slate';
  }
}
