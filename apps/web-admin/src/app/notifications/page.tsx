'use client';

import { useEffect, useState } from 'react';
import { AdminShell } from '@/components/AdminShell';
import { ApiError, adminListBroadcasts, adminSendBroadcast } from '@/lib/api';
import type { BroadcastCampaign, BroadcastSegment } from '@/lib/types';

export default function NotificationsPage() {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [segment, setSegment] = useState<BroadcastSegment>('all');
  const [usePhone, setUsePhone] = useState(false);
  const [phone, setPhone] = useState('+7');

  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [flash, setFlash] = useState<string | null>(null);
  const [history, setHistory] = useState<BroadcastCampaign[] | null>(null);

  function loadHistory() {
    adminListBroadcasts()
      .then(setHistory)
      .catch((e: ApiError) => setError(e.message));
  }

  useEffect(loadHistory, []);

  const phoneValid = !usePhone || /^\+7\d{10}$/.test(phone);
  const canSend = title.trim().length > 0 && body.trim().length > 0 && phoneValid && !sending;

  async function onSend() {
    if (!canSend) return;
    setSending(true);
    setError(null);
    setFlash(null);
    try {
      const res = await adminSendBroadcast({
        title: title.trim(),
        body: body.trim(),
        segment,
        phone: usePhone ? phone : undefined,
      });
      setFlash(
        `Отправлено: ${res.sent} из ${res.recipients} получателей` +
          (res.failed ? `, ошибок: ${res.failed}` : ''),
      );
      setTitle('');
      setBody('');
      loadHistory();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'не удалось отправить');
    } finally {
      setSending(false);
    }
  }

  return (
    <AdminShell>
      <div className="max-w-3xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <h1 className="text-2xl font-bold text-slate-900">Уведомления</h1>
        <p className="mt-1 text-sm text-slate-500">
          Push-рассылка пользователям приложения с зарегистрированным устройством.
        </p>

        {error && (
          <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
        )}
        {flash && (
          <p className="mt-4 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{flash}</p>
        )}

        {/* Composer */}
        <section className="mt-6 card space-y-4">
          <Field label="Заголовок">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={120}
              className="input"
              placeholder="Скидка 15% на генеральную уборку"
            />
          </Field>
          <Field label="Текст">
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              maxLength={500}
              rows={4}
              className="input resize-y"
              placeholder="Только до конца недели — закажите уборку со скидкой."
            />
          </Field>

          <Field label="Аудитория">
            <select
              value={segment}
              onChange={(e) => setSegment(e.target.value as BroadcastSegment)}
              disabled={usePhone}
              className="input disabled:opacity-50"
            >
              <option value="all">Все пользователи</option>
              <option value="has_orders">Только с заказами</option>
            </select>
          </Field>

          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={usePhone}
              onChange={(e) => setUsePhone(e.target.checked)}
              className="size-4"
            />
            <span className="text-sm text-slate-700">Отправить одному номеру</span>
          </label>
          {usePhone && (
            <Field label="Номер телефона">
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="input"
                placeholder="+77011234567"
              />
              {!phoneValid && (
                <span className="mt-1 block text-xs text-red-500">Формат: +7XXXXXXXXXX</span>
              )}
            </Field>
          )}

          <div className="flex justify-end">
            <button type="button" onClick={onSend} disabled={!canSend} className="btn-primary">
              {sending ? 'Отправка…' : 'Отправить'}
            </button>
          </div>
        </section>

        {/* History */}
        <h2 className="mt-10 text-lg font-bold text-slate-900">История рассылок</h2>
        {!history && <p className="mt-3 text-slate-400">Загрузка…</p>}
        {history && history.length === 0 && (
          <p className="mt-3 text-sm text-slate-400">Пока ничего не отправлено.</p>
        )}
        {history && history.length > 0 && (
          <div className="mt-4 space-y-3">
            {history.map((c) => (
              <div key={c.batchId} className="rounded-xl border border-slate-200 bg-white p-4">
                <div className="flex items-start justify-between gap-3">
                  <p className="font-semibold text-slate-900">{c.title}</p>
                  <span className="shrink-0 text-xs text-slate-400">
                    {new Date(c.createdAt).toLocaleString('ru')}
                  </span>
                </div>
                <p className="mt-1 text-sm text-slate-600">{c.body}</p>
                <p className="mt-2 text-xs text-slate-500">
                  Доставлено {c.sent} из {c.total}
                  {c.failed > 0 && <span className="text-red-500"> · ошибок {c.failed}</span>}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminShell>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}
