'use client';

import { useEffect, useState } from 'react';
import { AdminShell } from '@/components/AdminShell';
import { ApiError, adminGetHomePlans, adminUpdateHomePlans } from '@/lib/api';
import type { HomePlan, HomePlanGroup, HomePlans } from '@/lib/types';

const GROUP_LABELS: Record<HomePlanGroup, string> = {
  apartment: 'Квартира',
  house: 'Частный дом',
};

const GROUPS = Object.keys(GROUP_LABELS) as HomePlanGroup[];

// Mirrors the API's HOME_PLANS_MAX_PER_GROUP — the mobile home row only fits a
// handful of tiles comfortably.
const MAX_PER_GROUP = 6;

// Monotonic client-side id for freshly-added tiles so React keys never collide
// (the API re-assigns stable keys on save).
let newTileSeq = 0;

function emptyPlan(): HomePlan {
  return { key: `new-${newTileSeq++}`, title: '', rooms: '', bath: '', price: '', badge: '' };
}

function isBlank(s: string): boolean {
  return s.trim().length === 0;
}

type PlanState = 'valid' | 'empty' | 'partial';

// 'empty' = freshly added, nothing typed (silently dropped on save);
// 'partial' = some required fields filled, some not (blocks save);
// 'valid' = all four required fields present.
function planState(p: HomePlan): PlanState {
  const filled = [p.title, p.rooms, p.bath, p.price].filter((s) => !isBlank(s)).length;
  if (filled === 4) return 'valid';
  if (filled === 0) return 'empty';
  return 'partial';
}

function cleanPlan(p: HomePlan): HomePlan {
  const badge = (p.badge ?? '').trim();
  const base: HomePlan = {
    key: p.key,
    title: p.title.trim(),
    rooms: p.rooms.trim(),
    bath: p.bath.trim(),
    price: p.price.trim(),
  };
  return badge ? { ...base, badge } : base;
}

export default function HomePlansPage() {
  const [draft, setDraft] = useState<HomePlans | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    adminGetHomePlans()
      .then((d) => {
        setDraft(d);
        setDirty(false);
      })
      .catch((e: ApiError) => setError(e.message));
  }, []);

  // Warn before a full-page unload (refresh / tab close) if there are unsaved edits.
  useEffect(() => {
    if (!dirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [dirty]);

  function mutate(next: (d: HomePlans) => HomePlans) {
    setDraft((d) => (d ? next(d) : d));
    setSavedAt(null);
    setDirty(true);
  }

  function updatePlan(group: HomePlanGroup, idx: number, patch: Partial<HomePlan>) {
    mutate((d) => ({ ...d, [group]: d[group].map((p, i) => (i === idx ? { ...p, ...patch } : p)) }));
  }

  function addPlan(group: HomePlanGroup) {
    mutate((d) =>
      d[group].length >= MAX_PER_GROUP ? d : { ...d, [group]: [...d[group], emptyPlan()] },
    );
  }

  function removePlan(group: HomePlanGroup, idx: number) {
    mutate((d) => ({ ...d, [group]: d[group].filter((_, i) => i !== idx) }));
  }

  function movePlan(group: HomePlanGroup, idx: number, dir: -1 | 1) {
    mutate((d) => {
      const arr = d[group];
      const j = idx + dir;
      if (j < 0 || j >= arr.length) return d;
      const a = arr[idx];
      const b = arr[j];
      if (!a || !b) return d;
      const next = arr.slice();
      next[idx] = b;
      next[j] = a;
      return { ...d, [group]: next };
    });
  }

  async function onSave() {
    if (!draft) return;
    // Block a half-filled tile — it's almost certainly a mistake and the API
    // would silently drop it.
    const hasPartial = GROUPS.some((g) => draft[g].some((p) => planState(p) === 'partial'));
    if (hasPartial) {
      setError('Заполните все поля плитки (заголовок, цена, комнаты, санузлы) или удалите её.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      // Drop untouched empty tiles, trim everything, drop empty badges.
      const clean: HomePlans = {
        apartment: draft.apartment.filter((p) => planState(p) === 'valid').map(cleanPlan),
        house: draft.house.filter((p) => planState(p) === 'valid').map(cleanPlan),
      };
      const next = await adminUpdateHomePlans(clean);
      setDraft(next);
      setSavedAt(Date.now());
      setDirty(false);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'save failed');
    } finally {
      setSaving(false);
    }
  }

  return (
    <AdminShell>
      <div className="max-w-3xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Тарифы на главной</h1>
            <p className="mt-1 text-sm text-slate-500">
              Плитки быстрых тарифов вверху главного экрана приложения (Квартира / Частный дом).
              Пустая группа скрывается в приложении.
            </p>
          </div>
          <button
            type="button"
            onClick={onSave}
            disabled={!draft || saving}
            className="btn-primary shrink-0"
          >
            {saving ? 'Сохранение…' : 'Сохранить'}
          </button>
        </div>

        {error && (
          <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
        )}
        {savedAt && (
          <p className="mt-4 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            Сохранено — изменения сразу видны в приложении.
          </p>
        )}

        {!draft && !error && <p className="mt-6 text-slate-400">Загрузка…</p>}

        {draft &&
          GROUPS.map((group) => {
            const atMax = draft[group].length >= MAX_PER_GROUP;
            return (
              <section key={group} className="mt-8">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-slate-800">{GROUP_LABELS[group]}</h2>
                  <button
                    type="button"
                    onClick={() => addPlan(group)}
                    disabled={atMax}
                    className="btn-ghost text-sm disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    + Добавить плитку
                  </button>
                </div>
                {atMax && (
                  <p className="mt-1 text-xs text-slate-400">
                    Максимум {MAX_PER_GROUP} плиток в группе.
                  </p>
                )}

                <div className="mt-3 space-y-4">
                  {draft[group].length === 0 && (
                    <p className="rounded-xl border border-dashed border-slate-200 px-4 py-6 text-center text-sm text-slate-400">
                      Нет плиток — группа скрыта в приложении. Нажмите «Добавить плитку», чтобы
                      показать.
                    </p>
                  )}
                  {draft[group].map((plan, idx) => {
                    const state = planState(plan);
                    return (
                      <div
                        key={plan.key}
                        className={`rounded-2xl border bg-white p-4 shadow-sm ${
                          state === 'partial' ? 'border-red-300' : 'border-slate-200'
                        }`}
                      >
                        <div className="grid gap-3 sm:grid-cols-2">
                          <PlanField
                            label="Заголовок"
                            value={plan.title}
                            onChange={(v) => updatePlan(group, idx, { title: v })}
                            placeholder="Однушка"
                            required
                          />
                          <PlanField
                            label="Цена"
                            value={plan.price}
                            onChange={(v) => updatePlan(group, idx, { price: v })}
                            placeholder="от 15 000 ₸"
                            required
                          />
                          <PlanField
                            label="Комнаты / площадь"
                            value={plan.rooms}
                            onChange={(v) => updatePlan(group, idx, { rooms: v })}
                            placeholder="1 комната"
                            required
                          />
                          <PlanField
                            label="Санузлы"
                            value={plan.bath}
                            onChange={(v) => updatePlan(group, idx, { bath: v })}
                            placeholder="1 санузел"
                            required
                          />
                          <PlanField
                            label="Бейдж (необязательно)"
                            value={plan.badge ?? ''}
                            onChange={(v) => updatePlan(group, idx, { badge: v })}
                            placeholder="TOP"
                          />
                        </div>
                        <div className="mt-3 flex items-center justify-between">
                          <div className="flex gap-1">
                            <button
                              type="button"
                              onClick={() => movePlan(group, idx, -1)}
                              disabled={idx === 0}
                              aria-label="Переместить вверх"
                              className="rounded-md border border-slate-200 px-2 py-1 text-sm text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-30"
                            >
                              ↑
                            </button>
                            <button
                              type="button"
                              onClick={() => movePlan(group, idx, 1)}
                              disabled={idx === draft[group].length - 1}
                              aria-label="Переместить вниз"
                              className="rounded-md border border-slate-200 px-2 py-1 text-sm text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-30"
                            >
                              ↓
                            </button>
                          </div>
                          <button
                            type="button"
                            onClick={() => removePlan(group, idx)}
                            className="text-sm font-medium text-red-600 hover:text-red-700"
                          >
                            Удалить
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })}
      </div>
    </AdminShell>
  );
}

function PlanField({
  label,
  value,
  onChange,
  placeholder,
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
}) {
  const showError = required && value.trim().length === 0;
  return (
    <label className="block">
      <span className="text-xs font-medium text-slate-500">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`input mt-1 ${showError ? 'border-red-300' : ''}`}
      />
    </label>
  );
}
