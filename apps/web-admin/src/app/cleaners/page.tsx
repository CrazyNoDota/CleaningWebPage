'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { AdminShell } from '@/components/AdminShell';
import { CleanerBadges } from '@/components/CleanerBadges';
import { ApiError, adminListCleaners } from '@/lib/api';
import type { AdminCleanerListItem, VerificationStatus } from '@/lib/types';

export default function CleanersPage() {
  const [items, setItems] = useState<AdminCleanerListItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<{
    isActive?: boolean;
    verificationStatus?: VerificationStatus;
  }>({});

  useEffect(() => {
    setItems(null);
    adminListCleaners(filter)
      .then(setItems)
      .catch((e: ApiError) => setError(e.message));
  }, [filter]);

  return (
    <AdminShell>
      <div className="max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Клинеры</h1>
            <p className="text-sm text-slate-500">
              Учётные записи и статус верификации.
            </p>
          </div>
          <Link href="/cleaners/new" className="btn-primary text-center">
            + Добавить клинера
          </Link>
        </div>

        <div className="mt-6 flex flex-col gap-3 text-sm sm:flex-row sm:flex-wrap">
          <Filter
            label="Статус"
            options={[
              { value: '', label: 'Любой' },
              { value: 'active', label: 'Активные' },
              { value: 'inactive', label: 'Заблокированные' },
            ]}
            value={
              filter.isActive === undefined
                ? ''
                : filter.isActive
                  ? 'active'
                  : 'inactive'
            }
            onChange={(v) =>
              setFilter((f) => ({
                ...f,
                isActive: v === '' ? undefined : v === 'active',
              }))
            }
          />
          <Filter
            label="Верификация"
            options={[
              { value: '', label: 'Любая' },
              { value: 'unverified', label: 'Не проверен' },
              { value: 'pending', label: 'На проверке' },
              { value: 'verified', label: 'Проверен' },
              { value: 'rejected', label: 'Отклонён' },
            ]}
            value={filter.verificationStatus ?? ''}
            onChange={(v) =>
              setFilter((f) => ({
                ...f,
                verificationStatus: (v || undefined) as VerificationStatus | undefined,
              }))
            }
          />
        </div>

        {error && (
          <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
        )}

        <div className="mt-6 card overflow-x-auto p-0">
          <table className="min-w-[860px] text-sm">
            <thead className="text-left bg-slate-50 text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Имя</th>
                <th className="px-4 py-3 font-medium">Телефон</th>
                <th className="px-4 py-3 font-medium">Опыт</th>
                <th className="px-4 py-3 font-medium">Языки</th>
                <th className="px-4 py-3 font-medium">Рейтинг</th>
                <th className="px-4 py-3 font-medium">Статус</th>
                <th className="px-4 py-3"></th>
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
                    Нет клинеров под текущий фильтр.
                  </td>
                </tr>
              )}
              {items?.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-900">
                    {c.user.name ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{c.user.phone}</td>
                  <td className="px-4 py-3 text-slate-600">
                    {c.yearsOfExperience} лет
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {c.languages.join(', ') || '—'}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {c.ratingCount > 0
                      ? `${c.ratingAvg.toFixed(1)} ★ (${c.ratingCount})`
                      : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <CleanerBadges
                      isActive={c.isActive}
                      verificationStatus={c.verificationStatus}
                    />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/cleaners/${c.id}`}
                      className="text-brand-600 hover:underline"
                    >
                      Открыть
                    </Link>
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

function Filter({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-2">
      <span className="text-slate-500">{label}:</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

