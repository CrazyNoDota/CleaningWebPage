'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { AdminShell } from '@/components/AdminShell';
import { ApiError, adminListServices } from '@/lib/api';
import type { AdminService } from '@/lib/types';

export default function ServicesPage() {
  const [services, setServices] = useState<AdminService[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    adminListServices()
      .then(setServices)
      .catch((e: ApiError) => setError(e.message));
  }, []);

  return (
    <AdminShell>
      <div className="max-w-4xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Услуги</h1>
            <p className="mt-1 text-sm text-slate-500">
              Название, описание, цена и фото — отображаются в приложении и на сайте.
            </p>
          </div>
          <Link href="/services/new" className="btn-primary shrink-0">
            + Создать
          </Link>
        </div>

        {error && (
          <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
        )}

        {!services && !error && (
          <p className="mt-6 text-slate-400">Загрузка…</p>
        )}

        {services && (
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {services.map((s) => (
              <Link
                key={s.id}
                href={`/services/${s.id}`}
                className="group flex gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm hover:border-brand-400 hover:shadow-md transition"
              >
                {/* Cover photo preview */}
                <div className="size-20 shrink-0 overflow-hidden rounded-xl bg-slate-100">
                  {s.photoUrl ? (
                    <img src={s.photoUrl} alt={s.nameRu} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-slate-300 text-2xl">
                      🖼
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-slate-900 truncate">{s.nameRu}</p>
                    {!s.isActive && (
                      <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
                        неактивна
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-slate-500 line-clamp-2">
                    {s.descRu || <span className="text-slate-300 italic">Описание не заполнено</span>}
                  </p>
                  <p className="mt-2 text-xs font-medium text-brand-600">
                    от {(s.basePrice / 100).toLocaleString('ru')} ₸
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </AdminShell>
  );
}
