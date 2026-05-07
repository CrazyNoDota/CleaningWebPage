'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { AdminShell } from '@/components/AdminShell';
import { ApiError, adminListOrders } from '@/lib/api';
import { formatDateTimeRu, formatMoneyRu, statusBadgeClass, statusLabel } from '@/lib/format';
import type { AdminOrderListItem, OrderStatus } from '@/lib/types';

const STATUSES: OrderStatus[] = [
  'created',
  'paid',
  'assigned',
  'en_route',
  'in_progress',
  'done',
  'reviewed',
  'cancelled',
];

export default function OrdersPage() {
  const [items, setItems] = useState<AdminOrderListItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<OrderStatus | ''>('');
  const [phone, setPhone] = useState('');

  useEffect(() => {
    setItems(null);
    adminListOrders({
      status: status || undefined,
      userPhone: phone.trim() || undefined,
    })
      .then(setItems)
      .catch((e: ApiError) => setError(e.message));
  }, [status, phone]);

  return (
    <AdminShell>
      <div className="px-8 py-8 max-w-7xl">
        <h1 className="text-2xl font-bold text-slate-900">Заказы</h1>
        <p className="text-sm text-slate-500">
          Все заказы в системе. Кликните по строке, чтобы открыть детали.
        </p>

        <div className="mt-6 flex gap-3 text-sm">
          <label className="flex items-center gap-2">
            <span className="text-slate-500">Статус:</span>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as OrderStatus | '')}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm"
            >
              <option value="">Любой</option>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {statusLabel(s)}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-2">
            <span className="text-slate-500">Телефон клиента:</span>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+77011234567"
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm"
            />
          </label>
        </div>

        {error && (
          <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        )}

        <div className="mt-6 card overflow-hidden p-0">
          <table className="w-full text-sm">
            <thead className="text-left bg-slate-50 text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Создан</th>
                <th className="px-4 py-3 font-medium">Клиент</th>
                <th className="px-4 py-3 font-medium">Услуга</th>
                <th className="px-4 py-3 font-medium">Запланирован</th>
                <th className="px-4 py-3 font-medium">Клинер</th>
                <th className="px-4 py-3 font-medium text-right">Сумма</th>
                <th className="px-4 py-3 font-medium">Статус</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items === null && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                    Загрузка…
                  </td>
                </tr>
              )}
              {items?.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                    Нет заказов под текущий фильтр.
                  </td>
                </tr>
              )}
              {items?.map((o) => (
                <tr key={o.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-slate-600">
                    <Link
                      href={`/orders/${o.id}`}
                      className="text-brand-600 hover:underline"
                    >
                      {formatDateTimeRu(o.createdAt)}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    {o.user?.name ?? '—'}
                    <div className="text-xs text-slate-400">{o.user?.phone}</div>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{o.service.nameRu}</td>
                  <td className="px-4 py-3 text-slate-600">
                    {o.scheduledAt ? formatDateTimeRu(o.scheduledAt) : '—'}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {o.cleaner?.user.name ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {formatMoneyRu(o.total, o.currency)}
                  </td>
                  <td className="px-4 py-3">
                    <span className={statusBadgeClass(o.status)}>
                      {statusLabel(o.status)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminShell>
  );
}
