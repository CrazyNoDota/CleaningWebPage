'use client';

import { Fragment, useEffect, useState } from 'react';
import { AdminShell } from '@/components/AdminShell';
import {
  ApiError,
  adminListApplications,
  adminUpdateApplication,
} from '@/lib/api';
import {
  applicationStatusBadgeClass,
  applicationStatusLabel,
  formatDateTimeRu,
} from '@/lib/format';
import type { AdminApplication, JobApplicationStatusValue } from '@/lib/types';

const STATUSES: JobApplicationStatusValue[] = [
  'new',
  'contacted',
  'interviewing',
  'hired',
  'rejected',
];

export default function ApplicationsPage() {
  const [items, setItems] = useState<AdminApplication[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<JobApplicationStatusValue | ''>('new');
  const [phone, setPhone] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [draftNotes, setDraftNotes] = useState<Record<string, string>>({});

  useEffect(() => {
    let cancelled = false;
    setItems(null);
    setError(null);
    adminListApplications({
      status: status || undefined,
      phone: phone.trim() || undefined,
    })
      .then((rows) => {
        if (!cancelled) setItems(rows);
      })
      .catch((e: ApiError) => {
        if (!cancelled) setError(e.message);
      });
    return () => {
      cancelled = true;
    };
  }, [status, phone]);

  async function patch(
    app: AdminApplication,
    body: { status?: JobApplicationStatusValue; notes?: string },
  ) {
    setBusyId(app.id);
    setError(null);
    try {
      const updated = await adminUpdateApplication(app.id, body);
      setItems((prev) => {
        if (prev === null) return prev;
        const matchesFilter = !status || updated.status === status;
        return matchesFilter
          ? prev.map((a) => (a.id === updated.id ? updated : a))
          : prev.filter((a) => a.id !== updated.id);
      });
    } catch (e) {
      setError((e as ApiError).message);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <AdminShell>
      <div className="max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <h1 className="text-2xl font-bold text-slate-900">Заявки в клинеры</h1>
        <p className="text-sm text-slate-500">
          Очередь заявок с публичного сайта. Кликните по строке, чтобы
          обновить статус и оставить заметку.
        </p>

        <div className="mt-6 flex flex-col gap-3 text-sm sm:flex-row sm:flex-wrap sm:items-center">
          <label className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-2">
            <span className="text-slate-500">Статус:</span>
            <select
              value={status}
              onChange={(e) =>
                setStatus(e.target.value as JobApplicationStatusValue | '')
              }
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm"
            >
              <option value="">Любой</option>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {applicationStatusLabel(s)}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-2">
            <span className="text-slate-500">Телефон:</span>
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

        <div className="mt-6 card overflow-x-auto p-0">
          <table className="min-w-[820px] text-sm">
            <thead className="text-left bg-slate-50 text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Получена</th>
                <th className="px-4 py-3 font-medium">Имя</th>
                <th className="px-4 py-3 font-medium">Телефон</th>
                <th className="px-4 py-3 font-medium">Город</th>
                <th className="px-4 py-3 font-medium">Возраст</th>
                <th className="px-4 py-3 font-medium">Статус</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items === null && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                    Загрузка…
                  </td>
                </tr>
              )}
              {items?.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                    Под текущий фильтр заявок нет.
                  </td>
                </tr>
              )}
              {items?.map((a) => {
                const isOpen = openId === a.id;
                const cityLabel = a.city?.name ?? a.cityFreeText ?? '—';
                return (
                  <Fragment key={a.id}>
                    <tr
                      className="hover:bg-slate-50 cursor-pointer"
                      onClick={() => {
                        setOpenId(isOpen ? null : a.id);
                        if (!isOpen)
                          setDraftNotes((d) => ({
                            ...d,
                            [a.id]: a.notes ?? '',
                          }));
                      }}
                    >
                      <td className="px-4 py-3 text-slate-600">
                        {formatDateTimeRu(a.createdAt)}
                      </td>
                      <td className="px-4 py-3 text-slate-900">{a.fullName}</td>
                      <td className="px-4 py-3 text-slate-600 tabular-nums">
                        {a.phone}
                      </td>
                      <td className="px-4 py-3 text-slate-600">{cityLabel}</td>
                      <td className="px-4 py-3 text-slate-600">
                        {a.age ?? '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={applicationStatusBadgeClass(a.status)}>
                          {applicationStatusLabel(a.status)}
                        </span>
                      </td>
                    </tr>
                    {isOpen && (
                      <tr className="bg-slate-50/50">
                        <td colSpan={6} className="px-4 py-4">
                          {a.experience && (
                            <div className="mb-3">
                              <div className="text-xs uppercase text-slate-400">
                                Опыт
                              </div>
                              <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">
                                {a.experience}
                              </p>
                            </div>
                          )}

                          {a.resumeUrl && (
                            <div className="mb-3">
                              <div className="text-xs uppercase text-slate-400">
                                Резюме
                              </div>
                              <a
                                href={a.resumeUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mt-1 inline-flex items-center gap-1 text-sm text-brand-600 hover:underline"
                              >
                                📄 Открыть файл
                              </a>
                            </div>
                          )}

                          <div className="mb-3">
                            <div className="text-xs uppercase text-slate-400">
                              Статус
                            </div>
                            <div className="mt-1 flex flex-wrap gap-2">
                              {STATUSES.map((s) => (
                                <button
                                  key={s}
                                  type="button"
                                  disabled={busyId === a.id || a.status === s}
                                  onClick={() => patch(a, { status: s })}
                                  className={
                                    a.status === s
                                      ? 'btn-primary'
                                      : 'btn-secondary'
                                  }
                                >
                                  {applicationStatusLabel(s)}
                                </button>
                              ))}
                            </div>
                          </div>

                          <div>
                            <div className="text-xs uppercase text-slate-400">
                              Внутренние заметки
                            </div>
                            <textarea
                              className="input mt-1 min-h-24"
                              maxLength={2000}
                              value={draftNotes[a.id] ?? ''}
                              onChange={(e) =>
                                setDraftNotes((d) => ({
                                  ...d,
                                  [a.id]: e.target.value,
                                }))
                              }
                            />
                            <div className="mt-2 flex justify-stretch sm:justify-end">
                              <button
                                type="button"
                                disabled={
                                  busyId === a.id ||
                                  (draftNotes[a.id] ?? '') === (a.notes ?? '')
                                }
                                onClick={() =>
                                  patch(a, { notes: draftNotes[a.id] ?? '' })
                                }
                                className="btn-primary w-full sm:w-auto"
                              >
                                Сохранить заметку
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </AdminShell>
  );
}
