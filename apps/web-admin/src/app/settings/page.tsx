'use client';

import { useEffect, useState } from 'react';
import { AdminShell } from '@/components/AdminShell';
import {
  ApiError,
  adminGetDirectorSettings,
  adminUpdateDirectorSettings,
} from '@/lib/api';
import type { DirectorChannel, DirectorSettings } from '@/lib/types';

export default function SettingsPage() {
  const [settings, setSettings] = useState<DirectorSettings | null>(null);
  const [draft, setDraft] = useState<DirectorSettings | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  useEffect(() => {
    adminGetDirectorSettings()
      .then((s) => {
        setSettings(s);
        setDraft(s);
      })
      .catch((e: ApiError) => setError(e.message));
  }, []);

  const dirty =
    draft !== null &&
    settings !== null &&
    (draft.channel !== settings.channel ||
      draft.whatsappPhone !== settings.whatsappPhone ||
      draft.telegramUsername !== settings.telegramUsername);

  const blockedReason =
    draft?.channel === 'telegram' && draft.telegramUsername.trim().length === 0
      ? 'Укажите Telegram-логин директора, чтобы переключиться на Telegram.'
      : null;

  async function onSave() {
    if (!draft || !dirty || blockedReason) return;
    setSaving(true);
    setError(null);
    try {
      const next = await adminUpdateDirectorSettings({
        channel: draft.channel,
        whatsappPhone: draft.whatsappPhone.trim(),
        telegramUsername: draft.telegramUsername.trim(),
      });
      setSettings(next);
      setDraft(next);
      setSavedAt(Date.now());
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'save failed');
    } finally {
      setSaving(false);
    }
  }

  return (
    <AdminShell>
      <div className="max-w-2xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <h1 className="text-2xl font-bold text-slate-900">Настройки</h1>
        <p className="mt-2 text-sm text-slate-500">
          Куда уходят сообщения о новых заказах. Клиент после оформления попадает
          в выбранный мессенджер с уже подготовленным текстом для директора.
        </p>

        {error && (
          <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        )}

        {draft && (
          <div className="mt-6 space-y-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-soft sm:p-6">
            <fieldset>
              <legend className="text-sm font-semibold text-slate-700">
                Канал директора
              </legend>
              <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                <ChannelOption
                  current={draft.channel}
                  value="whatsapp"
                  label="WhatsApp"
                  hint="Открывает чат с директором в WhatsApp (wa.me)."
                  onSelect={(v) => setDraft({ ...draft, channel: v })}
                />
                <ChannelOption
                  current={draft.channel}
                  value="telegram"
                  label="Telegram"
                  hint="Открывает чат с директором в Telegram (t.me)."
                  onSelect={(v) => setDraft({ ...draft, channel: v })}
                />
              </div>
            </fieldset>

            <label className="block">
              <span className="text-sm font-medium text-slate-700">
                WhatsApp номер директора
              </span>
              <input
                value={draft.whatsappPhone}
                onChange={(e) =>
                  setDraft({ ...draft, whatsappPhone: e.target.value })
                }
                placeholder="77055975056"
                className="input mt-1"
                inputMode="numeric"
              />
              <span className="mt-1 block text-xs text-slate-400">
                Только цифры, в международном формате без +.
              </span>
            </label>

            <label className="block">
              <span className="text-sm font-medium text-slate-700">
                Telegram-логин директора
              </span>
              <div className="mt-1 flex items-center rounded-2xl border border-slate-200 bg-white focus-within:border-brand-600">
                <span className="px-3 text-slate-400">@</span>
                <input
                  value={draft.telegramUsername}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      telegramUsername: e.target.value.replace(/^@+/, ''),
                    })
                  }
                  placeholder="shinex_director"
                  className="w-full bg-transparent py-2.5 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
                />
              </div>
              <span className="mt-1 block text-xs text-slate-400">
                Без @. Например: shinex_director.
              </span>
            </label>

            {blockedReason && (
              <p className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
                {blockedReason}
              </p>
            )}

            <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:justify-end">
              {savedAt && !dirty && (
                <span className="text-xs text-slate-400 sm:mr-3">Сохранено</span>
              )}
              <button
                type="button"
                onClick={onSave}
                disabled={!dirty || saving || Boolean(blockedReason)}
                className="btn-primary"
              >
                {saving ? 'Сохранение…' : 'Сохранить'}
              </button>
            </div>
          </div>
        )}
      </div>
    </AdminShell>
  );
}

function ChannelOption({
  current,
  value,
  label,
  hint,
  onSelect,
}: {
  current: DirectorChannel;
  value: DirectorChannel;
  label: string;
  hint: string;
  onSelect: (v: DirectorChannel) => void;
}) {
  const active = current === value;
  return (
    <button
      type="button"
      onClick={() => onSelect(value)}
      className={`text-left rounded-xl border p-4 transition ${
        active
          ? 'border-brand-600 bg-brand-50'
          : 'border-slate-200 hover:border-slate-300'
      }`}
    >
      <div className="flex items-center gap-2">
        <span
          className={`inline-block size-3.5 rounded-full border-2 ${
            active ? 'border-brand-600 bg-brand-600' : 'border-slate-300'
          }`}
        />
        <span className="font-semibold text-slate-900">{label}</span>
      </div>
      <p className="mt-1 text-xs text-slate-500">{hint}</p>
    </button>
  );
}
