'use client';

import { useEffect, useMemo, useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import { SiteHeader } from '@/components/SiteHeader';
import {
  ApiError,
  createAddress,
  createOrder,
  deleteAddress,
  listAddresses,
  listServices,
  quote as quoteApi,
  updateAddress,
} from '@/lib/api';
import { formatMoney } from '@/lib/format';
import { useSession } from '@/lib/use-session';
import type { Address, Locale, Quote, Service } from '@/lib/types';

type Step = 'service' | 'configure' | 'address' | 'schedule' | 'confirm';
const STEPS: Step[] = ['service', 'configure', 'address', 'schedule', 'confirm'];

interface AddressDraft {
  city: string;
  label: string;
  street: string;
  building: string;
  apartment: string;
  comment: string;
}

const EMPTY_ADDRESS: AddressDraft = {
  city: 'astana',
  label: '',
  street: '',
  building: '',
  apartment: '',
  comment: '',
};

export default function BookPage() {
  const t = useTranslations();
  const locale = useLocale() as Locale;
  const router = useRouter();
  const { session, hydrated } = useSession();

  // Wizard state
  const [step, setStep] = useState<Step>('service');
  const [services, setServices] = useState<Service[] | null>(null);
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [areaM2, setAreaM2] = useState(60);
  const [rooms, setRooms] = useState(2);
  const [chosen, setChosen] = useState<Record<string, number>>({});
  const [quote, setQuote] = useState<Quote | null>(null);

  const [addresses, setAddresses] = useState<Address[] | null>(null);
  const [addressMode, setAddressMode] = useState<'pick' | 'new'>('new');
  const [addressId, setAddressId] = useState<string | null>(null);
  const [draft, setDraft] = useState<AddressDraft>(EMPTY_ADDRESS);

  const [scheduledAt, setScheduledAt] = useState<string>(() => defaultSchedule());
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedService = useMemo(
    () => services?.find((s) => s.slug === selectedSlug) ?? null,
    [services, selectedSlug],
  );

  // Load services
  useEffect(() => {
    listServices(locale).then(setServices).catch((e: ApiError) => setError(e.message));
  }, [locale]);

  // Load saved addresses once authed
  useEffect(() => {
    if (!hydrated || !session) return;
    listAddresses()
      .then((rows) => {
        setAddresses(rows);
        const first = rows[0];
        if (first) {
          setAddressMode('pick');
          setAddressId(first.id);
        }
      })
      .catch((e: ApiError) => setError(e.message));
  }, [hydrated, session]);

  // Recompute quote whenever inputs change
  useEffect(() => {
    if (!selectedSlug) return;
    const opts = Object.entries(chosen)
      .filter(([, qty]) => qty > 0)
      .map(([key, qty]) => ({ key, qty }));
    const handle = setTimeout(() => {
      quoteApi({
        serviceSlug: selectedSlug,
        inputs: { area_m2: areaM2, rooms },
        options: opts,
      })
        .then(setQuote)
        .catch((e: ApiError) => setError(e.message));
    }, 200);
    return () => clearTimeout(handle);
  }, [selectedSlug, areaM2, rooms, chosen]);

  const currentIndex = STEPS.indexOf(step);
  const canPrev = currentIndex > 0;
  const canNext = canMoveForward();

  function canMoveForward(): boolean {
    switch (step) {
      case 'service':
        return Boolean(selectedSlug);
      case 'configure':
        return Boolean(quote && areaM2 > 0 && rooms > 0);
      case 'address':
        if (!session) return false;
        if (addressMode === 'pick') return Boolean(addressId);
        return draft.street.length > 0 && draft.building.length > 0;
      case 'schedule':
        return Boolean(scheduledAt);
      case 'confirm':
        return true;
    }
  }

  function goPrev() {
    if (!canPrev) return;
    const prev = STEPS[currentIndex - 1];
    if (prev) setStep(prev);
  }

  async function goNext() {
    setError(null);
    if (step === 'address' && !session) {
      router.push(`/login?next=${encodeURIComponent('/book')}`);
      return;
    }
    if (step === 'confirm') {
      await onSubmit();
      return;
    }
    const next = STEPS[currentIndex + 1];
    if (next) setStep(next);
  }

  async function onSubmit() {
    if (!selectedSlug) return;
    setSubmitting(true);
    try {
      // Resolve address: either an existing id, or create one inline.
      // Required by API contract; canMoveForward gates this so we should always
      // have a valid id by the time we get here.
      let resolvedAddressId: string;
      if (addressMode === 'new') {
        const created = await createAddress({
          city: draft.city,
          label: draft.label || undefined,
          street: draft.street,
          building: draft.building,
          apartment: draft.apartment || undefined,
          comment: draft.comment || undefined,
        });
        resolvedAddressId = created.id;
      } else if (addressId) {
        resolvedAddressId = addressId;
      } else {
        setError('please pick or add an address');
        return;
      }
      const opts = Object.entries(chosen)
        .filter(([, qty]) => qty > 0)
        .map(([key, qty]) => ({ key, qty }));
      const order = await createOrder({
        serviceSlug: selectedSlug,
        scheduledAt: new Date(scheduledAt).toISOString(),
        addressId: resolvedAddressId,
        inputs: { area_m2: areaM2, rooms },
        options: opts,
        notes: notes || undefined,
      });
      router.push(`/orders/${order.id}`);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'submit failed');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1 mx-auto max-w-3xl w-full px-6 py-10">
        <h1 className="text-2xl font-bold text-slate-900">{t('wizard.title')}</h1>
        <p className="mt-1 text-sm text-slate-500">
          {t('wizard.step', { current: currentIndex + 1, total: STEPS.length })} ·{' '}
          {t(`wizard.step${cap(step)}`)}
        </p>

        <div className="mt-8 card space-y-6">
          {step === 'service' && (
            <ServiceStep
              services={services}
              selectedSlug={selectedSlug}
              onSelect={setSelectedSlug}
              locale={locale}
            />
          )}
          {step === 'configure' && selectedService && (
            <ConfigureStep
              service={selectedService}
              areaM2={areaM2}
              setAreaM2={setAreaM2}
              rooms={rooms}
              setRooms={setRooms}
              chosen={chosen}
              setChosen={setChosen}
              quote={quote}
              locale={locale}
            />
          )}
          {step === 'address' && (
            <AddressStep
              hydrated={hydrated}
              session={Boolean(session)}
              addresses={addresses}
              setAddresses={setAddresses}
              mode={addressMode}
              setMode={setAddressMode}
              addressId={addressId}
              setAddressId={setAddressId}
              draft={draft}
              setDraft={setDraft}
              onError={setError}
            />
          )}
          {step === 'schedule' && (
            <ScheduleStep
              scheduledAt={scheduledAt}
              setScheduledAt={setScheduledAt}
              notes={notes}
              setNotes={setNotes}
            />
          )}
          {step === 'confirm' && quote && (
            <ConfirmStep
              service={selectedService}
              quote={quote}
              areaM2={areaM2}
              rooms={rooms}
              chosen={chosen}
              addressMode={addressMode}
              addressId={addressId}
              addresses={addresses}
              draft={draft}
              scheduledAt={scheduledAt}
              notes={notes}
              locale={locale}
            />
          )}

          {error && (
            <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
          )}

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={goPrev}
              disabled={!canPrev}
              className="btn-secondary"
            >
              {t('common.back')}
            </button>
            <div className="flex items-center gap-4">
              {quote && (
                <span className="text-sm text-slate-500">
                  {t('wizard.estimatedTotal')}:{' '}
                  <strong className="text-slate-900">
                    {formatMoney(quote.total, quote.currency, locale)}
                  </strong>
                </span>
              )}
              <button
                type="button"
                onClick={goNext}
                disabled={!canNext || submitting}
                className="btn-primary"
              >
                {submitting
                  ? t('common.loading')
                  : step === 'confirm'
                  ? t('wizard.submitOrder')
                  : t('common.next')}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

// ── steps ──────────────────────────────────────────────────────────

function ServiceStep({
  services,
  selectedSlug,
  onSelect,
  locale,
}: {
  services: Service[] | null;
  selectedSlug: string | null;
  onSelect: (s: string) => void;
  locale: Locale;
}) {
  const t = useTranslations();
  if (services === null) return <p className="text-slate-500">{t('common.loading')}</p>;
  if (services.length === 0)
    return <p className="text-slate-500">No services available.</p>;
  return (
    <div className="space-y-3">
      {services.map((s) => (
        <button
          key={s.slug}
          type="button"
          onClick={() => onSelect(s.slug)}
          className={`w-full text-left rounded-xl border p-4 transition ${
            selectedSlug === s.slug
              ? 'border-brand-600 bg-brand-50'
              : 'border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="font-semibold text-slate-900">{s.name}</div>
              {s.description && (
                <div className="mt-1 text-sm text-slate-500">{s.description}</div>
              )}
            </div>
            <div className="text-sm text-slate-500">
              {t('wizard.estimatedTotal')} от{' '}
              <strong>{formatMoney(s.basePrice, s.currency, locale)}</strong>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}

function ConfigureStep({
  service,
  areaM2,
  setAreaM2,
  rooms,
  setRooms,
  chosen,
  setChosen,
  quote,
  locale,
}: {
  service: Service;
  areaM2: number;
  setAreaM2: (n: number) => void;
  rooms: number;
  setRooms: (n: number) => void;
  chosen: Record<string, number>;
  setChosen: (n: Record<string, number>) => void;
  quote: Quote | null;
  locale: Locale;
}) {
  const t = useTranslations();
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <label>
          <span className="text-sm font-medium text-slate-700">{t('wizard.areaM2')}</span>
          <input
            type="number"
            min={10}
            max={500}
            value={areaM2}
            onChange={(e) => setAreaM2(Math.max(0, Number(e.target.value)))}
            className="input mt-1"
          />
        </label>
        <label>
          <span className="text-sm font-medium text-slate-700">{t('wizard.rooms')}</span>
          <input
            type="number"
            min={1}
            max={10}
            value={rooms}
            onChange={(e) => setRooms(Math.max(1, Number(e.target.value)))}
            className="input mt-1"
          />
        </label>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-slate-700">{t('wizard.extras')}</h3>
        {service.options.length === 0 && (
          <p className="mt-2 text-sm text-slate-500">{t('wizard.noOptions')}</p>
        )}
        <div className="mt-2 space-y-2">
          {service.options.map((opt) => {
            const qty = chosen[opt.key] ?? 0;
            return (
              <label
                key={opt.key}
                className="flex items-center justify-between rounded-lg border border-slate-200 px-4 py-3 cursor-pointer hover:bg-slate-50"
              >
                <span className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={qty > 0}
                    onChange={(e) =>
                      setChosen({ ...chosen, [opt.key]: e.target.checked ? 1 : 0 })
                    }
                    className="size-4"
                  />
                  <span className="text-sm text-slate-800">{opt.label}</span>
                </span>
                <span className="text-sm text-slate-500">
                  +{formatMoney(opt.priceDelta, service.currency, locale)}
                </span>
              </label>
            );
          })}
        </div>
      </div>

      {quote && (
        <p className="text-sm text-slate-500">
          {t('wizard.estimatedTotal')}:{' '}
          <strong className="text-slate-900">
            {formatMoney(quote.total, quote.currency, locale)}
          </strong>
        </p>
      )}
    </div>
  );
}

function AddressStep({
  hydrated,
  session,
  addresses,
  setAddresses,
  mode,
  setMode,
  addressId,
  setAddressId,
  draft,
  setDraft,
  onError,
}: {
  hydrated: boolean;
  session: boolean;
  addresses: Address[] | null;
  setAddresses: (rows: Address[] | null) => void;
  mode: 'pick' | 'new';
  setMode: (m: 'pick' | 'new') => void;
  addressId: string | null;
  setAddressId: (s: string | null) => void;
  draft: AddressDraft;
  setDraft: (d: AddressDraft) => void;
  onError: (msg: string | null) => void;
}) {
  const t = useTranslations();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [edit, setEdit] = useState<AddressDraft>(EMPTY_ADDRESS);
  const [busyId, setBusyId] = useState<string | null>(null);

  if (!hydrated) return <p>{t('common.loading')}</p>;
  if (!session) {
    return <p className="text-slate-700">{t('wizard.needAuth')}</p>;
  }

  function startEdit(a: Address) {
    setEditingId(a.id);
    setEdit({
      city: 'astana',
      label: a.label ?? '',
      street: a.street,
      building: a.building,
      apartment: a.apartment ?? '',
      comment: a.comment ?? '',
    });
  }

  async function saveEdit(a: Address) {
    setBusyId(a.id);
    onError(null);
    try {
      const updated = await updateAddress(a.id, {
        label: edit.label || undefined,
        street: edit.street,
        building: edit.building,
        apartment: edit.apartment || undefined,
        comment: edit.comment || undefined,
      });
      setAddresses(
        (addresses ?? []).map((x) => (x.id === updated.id ? updated : x)),
      );
      setEditingId(null);
    } catch (e) {
      onError(e instanceof ApiError ? e.message : 'update failed');
    } finally {
      setBusyId(null);
    }
  }

  async function remove(a: Address) {
    if (typeof window !== 'undefined' && !window.confirm(t('wizardAddress.deleteConfirm'))) {
      return;
    }
    setBusyId(a.id);
    onError(null);
    try {
      await deleteAddress(a.id);
      const next = (addresses ?? []).filter((x) => x.id !== a.id);
      setAddresses(next);
      if (addressId === a.id) {
        const first = next[0];
        if (first) {
          setAddressId(first.id);
        } else {
          setMode('new');
          setAddressId(null);
        }
      }
    } catch (e) {
      onError(e instanceof ApiError ? e.message : 'delete failed');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-4">
      {addresses && addresses.length > 0 && (
        <div className="space-y-2">
          {addresses.map((a) => {
            const isEditing = editingId === a.id;
            return (
              <div
                key={a.id}
                className={`rounded-lg border p-4 ${
                  mode === 'pick' && addressId === a.id && !isEditing
                    ? 'border-brand-600 bg-brand-50'
                    : 'border-slate-200'
                }`}
              >
                {!isEditing ? (
                  <div className="flex items-start gap-3">
                    <input
                      type="radio"
                      checked={mode === 'pick' && addressId === a.id}
                      onChange={() => {
                        setMode('pick');
                        setAddressId(a.id);
                      }}
                      className="mt-1"
                      aria-label={a.label ?? a.street}
                    />
                    <div className="flex-1 text-sm">
                      {a.label && <strong className="block">{a.label}</strong>}
                      {a.street}, {a.building}
                      {a.apartment && `, кв. ${a.apartment}`}
                      {a.comment && (
                        <p className="mt-1 text-xs text-slate-500">{a.comment}</p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1 text-xs">
                      <button
                        type="button"
                        onClick={() => startEdit(a)}
                        disabled={busyId === a.id}
                        className="text-brand-600 hover:underline"
                      >
                        {t('wizardAddress.edit')}
                      </button>
                      <button
                        type="button"
                        onClick={() => remove(a)}
                        disabled={busyId === a.id}
                        className="text-red-600 hover:underline"
                      >
                        {t('wizardAddress.delete')}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <Input
                        label={t('wizard.label')}
                        value={edit.label}
                        onChange={(v) => setEdit({ ...edit, label: v })}
                      />
                      <Input
                        label={t('wizard.street')}
                        value={edit.street}
                        required
                        onChange={(v) => setEdit({ ...edit, street: v })}
                      />
                      <Input
                        label={t('wizard.building')}
                        value={edit.building}
                        required
                        onChange={(v) => setEdit({ ...edit, building: v })}
                      />
                      <Input
                        label={t('wizard.apartment')}
                        value={edit.apartment}
                        onChange={(v) => setEdit({ ...edit, apartment: v })}
                      />
                      <Input
                        label={t('wizard.comment')}
                        value={edit.comment}
                        onChange={(v) => setEdit({ ...edit, comment: v })}
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setEditingId(null)}
                        disabled={busyId === a.id}
                        className="btn-secondary"
                      >
                        {t('wizardAddress.cancel')}
                      </button>
                      <button
                        type="button"
                        onClick={() => saveEdit(a)}
                        disabled={
                          busyId === a.id ||
                          edit.street.length === 0 ||
                          edit.building.length === 0
                        }
                        className="btn-primary"
                      >
                        {t('wizardAddress.save')}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          <label className="flex items-start gap-3 rounded-lg border p-4 cursor-pointer border-slate-200">
            <input
              type="radio"
              checked={mode === 'new'}
              onChange={() => {
                setMode('new');
                setAddressId(null);
              }}
              className="mt-1"
            />
            <span className="text-sm font-medium">{t('wizard.newAddress')}</span>
          </label>
        </div>
      )}

      {mode === 'new' && (
        <div className="grid grid-cols-2 gap-3">
          <Input
            label={t('wizard.label')}
            value={draft.label}
            onChange={(v) => setDraft({ ...draft, label: v })}
          />
          <Input
            label="City (slug)"
            value={draft.city}
            onChange={(v) => setDraft({ ...draft, city: v })}
          />
          <Input
            label={t('wizard.street')}
            value={draft.street}
            required
            onChange={(v) => setDraft({ ...draft, street: v })}
          />
          <Input
            label={t('wizard.building')}
            value={draft.building}
            required
            onChange={(v) => setDraft({ ...draft, building: v })}
          />
          <Input
            label={t('wizard.apartment')}
            value={draft.apartment}
            onChange={(v) => setDraft({ ...draft, apartment: v })}
          />
          <Input
            label={t('wizard.comment')}
            value={draft.comment}
            onChange={(v) => setDraft({ ...draft, comment: v })}
          />
        </div>
      )}
    </div>
  );
}

function ScheduleStep({
  scheduledAt,
  setScheduledAt,
  notes,
  setNotes,
}: {
  scheduledAt: string;
  setScheduledAt: (s: string) => void;
  notes: string;
  setNotes: (s: string) => void;
}) {
  const t = useTranslations();
  return (
    <div className="space-y-4">
      <label className="block">
        <span className="text-sm font-medium text-slate-700">
          {t('wizard.scheduledAt')}
        </span>
        <input
          type="datetime-local"
          value={scheduledAt}
          onChange={(e) => setScheduledAt(e.target.value)}
          className="input mt-1"
        />
      </label>
      <label className="block">
        <span className="text-sm font-medium text-slate-700">{t('wizard.comment')}</span>
        <textarea
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="input mt-1"
        />
      </label>
    </div>
  );
}

function ConfirmStep({
  service,
  quote,
  areaM2,
  rooms,
  chosen,
  addressMode,
  addressId,
  addresses,
  draft,
  scheduledAt,
  notes,
  locale,
}: {
  service: Service | null;
  quote: Quote;
  areaM2: number;
  rooms: number;
  chosen: Record<string, number>;
  addressMode: 'pick' | 'new';
  addressId: string | null;
  addresses: Address[] | null;
  draft: AddressDraft;
  scheduledAt: string;
  notes: string;
  locale: Locale;
}) {
  const t = useTranslations();
  const addr =
    addressMode === 'pick'
      ? addresses?.find((a) => a.id === addressId)
      : null;
  const optionLines = Object.entries(chosen)
    .filter(([, qty]) => qty > 0)
    .map(([key]) => service?.options.find((o) => o.key === key)?.label ?? key);

  return (
    <dl className="divide-y divide-slate-200 text-sm">
      <Row label={t('wizard.stepService')} value={service?.name ?? '—'} />
      <Row
        label={t('wizard.stepConfigure')}
        value={`${areaM2} m², ${rooms} rooms${
          optionLines.length > 0 ? ` · ${optionLines.join(', ')}` : ''
        }`}
      />
      <Row
        label={t('wizard.stepAddress')}
        value={
          addr
            ? `${addr.street}, ${addr.building}${addr.apartment ? `, кв. ${addr.apartment}` : ''}`
            : `${draft.street}, ${draft.building}${draft.apartment ? `, кв. ${draft.apartment}` : ''}`
        }
      />
      <Row label={t('wizard.scheduledAt')} value={scheduledAt} />
      {notes && <Row label={t('wizard.comment')} value={notes} />}
      <Row
        label={t('wizard.estimatedTotal')}
        value={formatMoney(quote.total, quote.currency, locale)}
        emphasize
      />
    </dl>
  );
}

// ── tiny pieces ────────────────────────────────────────────────────

function Row({
  label,
  value,
  emphasize,
}: {
  label: string;
  value: string;
  emphasize?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between py-3">
      <dt className="text-slate-500">{label}</dt>
      <dd
        className={
          emphasize ? 'font-bold text-slate-900 text-lg' : 'font-medium text-slate-900'
        }
      >
        {value}
      </dd>
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-700">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        className="input mt-1"
      />
    </label>
  );
}

function defaultSchedule(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(10, 0, 0, 0);
  // datetime-local wants YYYY-MM-DDTHH:mm in the local zone
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours(),
  )}:${pad(d.getMinutes())}`;
}

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
