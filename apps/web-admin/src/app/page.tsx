'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { AdminShell } from '@/components/AdminShell';
import { ApiError, adminGetMetrics } from '@/lib/api';
import type { AdminMetrics } from '@/lib/types';

interface MetricCardProps {
  href: string;
  label: string;
  value: number | null;
  hint: string;
  highlight?: boolean;
}

function MetricCard({ href, label, value, hint, highlight }: MetricCardProps) {
  return (
    <Link
      href={href}
      className={`card transition-colors hover:border-brand-600 ${
        highlight && value && value > 0 ? 'border-brand-300 bg-brand-50/30' : ''
      }`}
    >
      <div className="text-xs uppercase tracking-wide text-slate-500">
        {label}
      </div>
      <div className="mt-2 text-3xl font-semibold tabular-nums text-slate-900">
        {value === null ? '—' : value}
      </div>
      <div className="mt-1 text-xs text-slate-400">{hint}</div>
    </Link>
  );
}

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    adminGetMetrics()
      .then((m) => {
        if (!cancelled) setMetrics(m);
      })
      .catch((e: ApiError) => {
        if (!cancelled) setError(e.message);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <AdminShell>
      <div className="px-8 py-8 max-w-5xl">
        <h1 className="text-2xl font-bold text-slate-900">Дашборд</h1>
        <p className="mt-2 text-sm text-slate-500">
          Сводка по операционной нагрузке. Цифры обновляются при заходе на
          страницу.
        </p>

        {error && (
          <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        )}

        <div className="mt-6 grid grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            href="/orders"
            label="Заказы сегодня"
            value={metrics?.ordersToday ?? null}
            hint="Создано с 00:00"
          />
          <MetricCard
            href="/cleaners"
            label="Активных клинеров"
            value={metrics?.activeCleaners ?? null}
            hint="С флагом isActive"
          />
          <MetricCard
            href="/reviews"
            label="Отзывы на модерации"
            value={metrics?.pendingReviews ?? null}
            hint="Требуют решения"
            highlight
          />
          <MetricCard
            href="/applications"
            label="Новые заявки"
            value={metrics?.pendingApplications ?? null}
            hint="Не разобраны"
            highlight
          />
        </div>

        <div className="mt-8">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Быстрый доступ
          </h2>
          <div className="mt-3 grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
            <Link href="/cleaners/new" className="card hover:border-brand-600">
              <div className="text-slate-500">Действие</div>
              <div className="mt-1 font-semibold text-slate-900">
                Добавить клинера
              </div>
            </Link>
            <Link href="/orders" className="card hover:border-brand-600">
              <div className="text-slate-500">Раздел</div>
              <div className="mt-1 font-semibold text-slate-900">
                Все заказы
              </div>
            </Link>
            <Link href="/applications" className="card hover:border-brand-600">
              <div className="text-slate-500">Раздел</div>
              <div className="mt-1 font-semibold text-slate-900">
                Заявки в клинеры
              </div>
            </Link>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
