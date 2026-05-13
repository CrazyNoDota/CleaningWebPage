'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { AdminShell } from '@/components/AdminShell';
import {
  ApiError,
  adminAssignCleaner,
  adminGetOrder,
  adminListCleaners,
  adminTransitionOrder,
} from '@/lib/api';
import {
  formatDateTimeRu,
  formatMoneyRu,
  statusBadgeClass,
  statusLabel,
} from '@/lib/format';
import type {
  AdminCleanerListItem,
  AdminOrderFull,
  OrderStatus,
} from '@/lib/types';

// Allowed forward transitions matching the server-side state machine.
// "cancelled" is offered from any non-terminal state (manager override).
const NEXT_STATUSES: Record<OrderStatus, OrderStatus[]> = {
  draft: ['created', 'cancelled'],
  created: ['paid', 'assigned', 'cancelled'],
  paid: ['assigned', 'cancelled'],
  assigned: ['en_route', 'cancelled'],
  en_route: ['in_progress', 'cancelled'],
  in_progress: ['done', 'cancelled'],
  done: ['reviewed'],
  reviewed: [],
  cancelled: [],
};

export default function OrderDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [order, setOrder] = useState<AdminOrderFull | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [flash, setFlash] = useState<string | null>(null);

  useEffect(() => {
    void refresh();
  }, [id]);

  async function refresh() {
    try {
      const next = await adminGetOrder(id);
      setOrder(next);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'не удалось загрузить');
    }
  }

  async function withBusy(fn: () => Promise<void>, success: string) {
    setBusy(true);
    setError(null);
    try {
      await fn();
      setFlash(success);
      setTimeout(() => setFlash(null), 1500);
      await refresh();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'не удалось выполнить');
    } finally {
      setBusy(false);
    }
  }

  return (
    <AdminShell>
      <div className="max-w-5xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <Link href="/orders" className="text-sm text-slate-500 hover:text-slate-900">
          ← Все заказы
        </Link>

        {!order && <p className="mt-6 text-slate-400">{error ?? 'Загрузка…'}</p>}

        {order && (
          <>
            <div className="mt-2 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h1 className="text-2xl font-bold text-slate-900">
                  {order.service.nameRu}
                </h1>
                <p className="mt-1 text-xs text-slate-400 font-mono">{order.id}</p>
                <div className="mt-2">
                  <span className={statusBadgeClass(order.status)}>
                    {statusLabel(order.status)}
                  </span>
                </div>
              </div>
              <div className="text-left text-sm text-slate-500 sm:text-right">
                <div className="text-2xl font-bold text-slate-900 tabular-nums">
                  {formatMoneyRu(order.total, order.currency)}
                </div>
                <div className="mt-1">Создан: {formatDateTimeRu(order.createdAt)}</div>
                {order.scheduledAt && (
                  <div>Запланирован: {formatDateTimeRu(order.scheduledAt)}</div>
                )}
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
              <CustomerCard order={order} />
              <AddressCard order={order} />
              <CleanerCard order={order} onAssign={(cid) =>
                withBusy(() => adminAssignCleaner(order.id, cid).then(() => undefined),
                  'Клинер назначен',
                )
              } busy={busy} />
            </div>

            <ActionPanel
              status={order.status}
              busy={busy}
              onTransition={(to) =>
                withBusy(
                  () => adminTransitionOrder(order.id, to).then(() => undefined),
                  `Статус → ${statusLabel(to)}`,
                )
              }
            />

            <EventLog events={order.events} />

            {flash && <p className="mt-4 text-sm text-emerald-700">{flash}</p>}
            {error && (
              <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </p>
            )}
          </>
        )}
      </div>
    </AdminShell>
  );
}

// ── cards ──────────────────────────────────────────────────────────

function CustomerCard({ order }: { order: AdminOrderFull }) {
  return (
    <section className="card">
      <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
        Клиент
      </h2>
      <div className="mt-2">
        <div className="font-medium text-slate-900">{order.user?.name ?? '—'}</div>
        <div className="text-sm text-slate-600">{order.user?.phone ?? '—'}</div>
        {order.user?.email && (
          <div className="text-sm text-slate-500">{order.user.email}</div>
        )}
      </div>
      {order.notes && (
        <p className="mt-3 text-sm text-slate-600 border-t border-slate-100 pt-3">
          <strong className="text-slate-500">Комментарий:</strong> {order.notes}
        </p>
      )}
    </section>
  );
}

function AddressCard({ order }: { order: AdminOrderFull }) {
  return (
    <section className="card">
      <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
        Адрес
      </h2>
      <div className="mt-2 text-sm">
        {order.address ? (
          <>
            <div className="font-medium text-slate-900">
              {order.address.street}, {order.address.building}
              {order.address.apartment && `, кв. ${order.address.apartment}`}
            </div>
            <div className="text-slate-500">{order.address.city.name}</div>
            {order.address.comment && (
              <div className="mt-1 text-slate-500">{order.address.comment}</div>
            )}
          </>
        ) : (
          <span className="text-slate-400">Не указан</span>
        )}
      </div>
    </section>
  );
}

function CleanerCard({
  order,
  onAssign,
  busy,
}: {
  order: AdminOrderFull;
  onAssign: (cleanerId: string) => Promise<void>;
  busy: boolean;
}) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [cleaners, setCleaners] = useState<AdminCleanerListItem[] | null>(null);
  const [pick, setPick] = useState<string>('');

  useEffect(() => {
    if (!pickerOpen) return;
    adminListCleaners({ isActive: true })
      .then((list) => {
        setCleaners(list);
        if (list[0]) setPick(list[0].id);
      })
      .catch(() => undefined);
  }, [pickerOpen]);

  return (
    <section className="card">
      <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
        Клинер
      </h2>
      {order.cleaner ? (
        <div className="mt-2">
          <div className="font-medium text-slate-900">
            {order.cleaner.user.name ?? '—'}
          </div>
          <div className="text-sm text-slate-500">{order.cleaner.user.phone}</div>
        </div>
      ) : (
        <div className="mt-2">
          <p className="text-sm text-slate-500">Не назначен.</p>
          {!pickerOpen && (
            <button
              type="button"
              onClick={() => setPickerOpen(true)}
              className="mt-2 btn-primary"
              disabled={busy || order.status === 'cancelled' || order.status === 'reviewed'}
            >
              Назначить клинера
            </button>
          )}
          {pickerOpen && (
            <div className="mt-2 space-y-2">
              {cleaners === null && <p className="text-sm text-slate-400">Загрузка…</p>}
              {cleaners && cleaners.length === 0 && (
                <p className="text-sm text-slate-400">Нет активных клинеров.</p>
              )}
              {cleaners && cleaners.length > 0 && (
                <>
                  <select
                    value={pick}
                    onChange={(e) => setPick(e.target.value)}
                    className="input"
                  >
                    {cleaners.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.user.name ?? c.user.phone} — рейтинг{' '}
                        {c.ratingCount > 0 ? c.ratingAvg.toFixed(1) : '—'}
                      </option>
                    ))}
                  </select>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <button
                      type="button"
                      onClick={() => onAssign(pick)}
                      disabled={busy || !pick}
                      className="btn-primary"
                    >
                      Назначить
                    </button>
                    <button
                      type="button"
                      onClick={() => setPickerOpen(false)}
                      className="btn-secondary"
                    >
                      Отмена
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </section>
  );
}

function ActionPanel({
  status,
  busy,
  onTransition,
}: {
  status: OrderStatus;
  busy: boolean;
  onTransition: (to: OrderStatus) => Promise<void>;
}) {
  const next = NEXT_STATUSES[status];
  if (next.length === 0) return null;
  return (
    <section className="mt-4 card">
      <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
        Действия
      </h2>
      <div className="mt-3 flex flex-wrap gap-2">
        {next.map((to) => (
          <button
            key={to}
            type="button"
            disabled={busy}
            onClick={() => onTransition(to)}
            className={
              to === 'cancelled'
                ? 'btn-secondary !text-red-700 !border-red-300 hover:!bg-red-50'
                : 'btn-primary'
            }
          >
            → {statusLabel(to)}
          </button>
        ))}
      </div>
    </section>
  );
}

function EventLog({ events }: { events: AdminOrderFull['events'] }) {
  return (
    <section className="mt-4 card">
      <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
        История событий
      </h2>
      <ol className="mt-3 space-y-2 text-sm">
        {events.map((e) => (
          <li key={e.id} className="flex items-baseline gap-3">
            <span className="w-28 shrink-0 text-xs text-slate-400 sm:w-36">
              {formatDateTimeRu(e.createdAt)}
            </span>
            <span className="font-mono text-xs text-slate-700">{e.type}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}
