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
  getDirectorSettings,
  listAddresses,
  listServices,
  quote as quoteApi,
  updateAddress,
} from '@/lib/api';
import { formatMoney } from '@/lib/format';
import { useSession } from '@/lib/use-session';
import type { Address, DirectorSettings, Locale, Quote, Service } from '@/lib/types';

type Step = 'service' | 'configure' | 'address' | 'schedule' | 'confirm';
const STEPS: Step[] = ['service', 'configure', 'address', 'schedule', 'confirm'];

interface AddressDraft {
  street: string;
  building: string;
  apartment: string;
}

interface AddressValidation {
  valid: boolean;
  errors: string[];
}

const EMPTY_ADDRESS: AddressDraft = {
  street: '',
  building: '',
  apartment: '',
};

const FALLBACK_DIRECTOR: DirectorSettings = {
  channel: 'whatsapp',
  whatsappPhone: '77055975056',
  telegramUsername: '',
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
  const [areaM2Input, setAreaM2Input] = useState('60');
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
  const [director, setDirector] = useState<DirectorSettings>(FALLBACK_DIRECTOR);

  const selectedService = useMemo(
    () => services?.find((s) => s.slug === selectedSlug) ?? null,
    [services, selectedSlug],
  );
  const areaM2 = useMemo(() => {
    const parsed = Number(areaM2Input);
    return Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
  }, [areaM2Input]);

  // Load services
  useEffect(() => {
    listServices(locale)
      .then(setServices)
      .catch((e: ApiError) => setError(e.message));
  }, [locale]);

  // Load director routing settings (which messenger to open after submit)
  useEffect(() => {
    getDirectorSettings()
      .then(setDirector)
      .catch(() => {
        /* keep fallback */
      });
  }, []);

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
    if (areaM2 <= 0 || rooms <= 0) {
      setQuote(null);
      return;
    }
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
        return validateAddressDraft(draft, locale).valid;
      case 'schedule':
        return Boolean(scheduledAt);
      case 'confirm':
        return true;
    }
  }

  function goPrev() {
    if (!canPrev) {
      if (typeof window !== 'undefined' && window.history.length > 1) {
        router.back();
      } else {
        router.push(`/${locale}`);
      }
      return;
    }
    const prev = STEPS[currentIndex - 1];
    if (prev) setStep(prev);
  }

  async function goNext() {
    setError(null);
    if (step === 'address' && !session) {
      router.push(`/login?next=${encodeURIComponent('/book')}`);
      return;
    }
    if (step === 'address' && addressMode === 'new') {
      const validation = validateAddressDraft(draft, locale);
      if (!validation.valid) {
        setError(validation.errors[0] ?? addressValidationMessage('invalid', locale));
        return;
      }
      setDraft(normalizeAddressDraft(draft));
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
        const normalizedDraft = normalizeAddressDraft(draft);
        const validation = validateAddressDraft(normalizedDraft, locale);
        if (!validation.valid) {
          setError(validation.errors[0] ?? addressValidationMessage('invalid', locale));
          return;
        }
        const created = await createAddress({
          city: 'astana',
          street: normalizedDraft.street,
          building: normalizedDraft.building,
          apartment: normalizedDraft.apartment || undefined,
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

      if (typeof window !== 'undefined' && quote) {
        window.location.href = buildDirectorOrderUrl({
          director,
          orderId: order.id,
          service: selectedService,
          quote,
          areaM2,
          rooms,
          chosen,
          address:
            addressMode === 'pick' ? (addresses?.find((a) => a.id === addressId) ?? null) : draft,
          scheduledAt,
          notes,
          locale,
          customerPhone: session?.user.phone ?? null,
        });
      } else {
        router.push(`/orders/${order.id}`);
      }
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'submit failed');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:px-6 sm:py-10">
        <h1 className="text-2xl font-bold text-slate-900">{t('wizard.title')}</h1>
        <p className="mt-1 text-sm text-slate-500">
          {t('wizard.step', { current: currentIndex + 1, total: STEPS.length })} ·{' '}
          {t(`wizard.step${cap(step)}`)}
        </p>

        <div className="mt-6 space-y-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-soft sm:mt-8 sm:p-6">
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
              areaM2Input={areaM2Input}
              setAreaM2Input={setAreaM2Input}
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

          {error && <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

          <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between">
            <button type="button" onClick={goPrev} className="btn-secondary w-full sm:w-auto">
              {t('common.back')}
            </button>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
              {quote && (
                <span className="text-sm text-slate-500 sm:text-right">
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
                className="btn-primary w-full sm:w-auto"
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
  if (services.length === 0) return <p className="text-slate-500">No services available.</p>;
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
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="font-semibold text-slate-900">{s.name}</div>
              {s.description && <div className="mt-1 text-sm text-slate-500">{s.description}</div>}
            </div>
            <div className="text-sm text-slate-500 sm:text-right">
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
  areaM2Input,
  setAreaM2Input,
  rooms,
  setRooms,
  chosen,
  setChosen,
  quote,
  locale,
}: {
  service: Service;
  areaM2Input: string;
  setAreaM2Input: (value: string) => void;
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
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label>
          <span className="text-sm font-medium text-slate-700">{t('wizard.areaM2')}</span>
          <input
            type="number"
            min={10}
            max={500}
            value={areaM2Input}
            onChange={(e) => setAreaM2Input(e.target.value)}
            className="input mt-1"
          />
        </label>
        <div>
          <span className="text-sm font-medium text-slate-700">{t('wizard.rooms')}</span>
          <div className="mt-1 flex h-12 overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <button
              type="button"
              onClick={() => setRooms(Math.max(1, rooms - 1))}
              disabled={rooms <= 1}
              className="flex w-14 items-center justify-center border-r border-slate-200 text-2xl font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-300"
              aria-label="Decrease rooms"
            >
              -
            </button>
            <div className="flex min-w-0 flex-1 items-center justify-center text-lg font-semibold text-slate-900">
              {rooms}
            </div>
            <button
              type="button"
              onClick={() => setRooms(Math.min(20, rooms + 1))}
              disabled={rooms >= 20}
              className="flex w-14 items-center justify-center border-l border-slate-200 bg-brand-600 text-2xl font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-slate-200"
              aria-label="Increase rooms"
            >
              +
            </button>
          </div>
        </div>
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
                    onChange={(e) => setChosen({ ...chosen, [opt.key]: e.target.checked ? 1 : 0 })}
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
  const locale = useLocale() as Locale;
  const [editingId, setEditingId] = useState<string | null>(null);
  const [edit, setEdit] = useState<AddressDraft>(EMPTY_ADDRESS);
  const [busyId, setBusyId] = useState<string | null>(null);
  const draftValidation = validateAddressDraft(draft, locale);
  const editValidation = validateAddressDraft(edit, locale);

  if (!hydrated) return <p>{t('common.loading')}</p>;
  if (!session) {
    return <p className="text-slate-700">{t('wizard.needAuth')}</p>;
  }

  function startEdit(a: Address) {
    setEditingId(a.id);
    setEdit({
      street: a.street,
      building: a.building,
      apartment: a.apartment ?? '',
    });
  }

  async function saveEdit(a: Address) {
    setBusyId(a.id);
    onError(null);
    const normalizedEdit = normalizeAddressDraft(edit);
    const validation = validateAddressDraft(normalizedEdit, locale);
    if (!validation.valid) {
      onError(validation.errors[0] ?? addressValidationMessage('invalid', locale));
      setBusyId(null);
      return;
    }
    try {
      const updated = await updateAddress(a.id, {
        street: normalizedEdit.street,
        building: normalizedEdit.building,
        apartment: normalizedEdit.apartment || undefined,
      });
      setAddresses((addresses ?? []).map((x) => (x.id === updated.id ? updated : x)));
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
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
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
                    </div>
                    <div className="flex gap-3 text-xs sm:flex-col sm:items-end sm:gap-1">
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
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <CityField />
                      <Input
                        label={t('wizard.street')}
                        value={edit.street}
                        required
                        maxLength={120}
                        onChange={(v) => setEdit({ ...edit, street: v })}
                      />
                      <Input
                        label={t('wizard.building')}
                        value={edit.building}
                        required
                        maxLength={20}
                        onChange={(v) => setEdit({ ...edit, building: v })}
                      />
                      <Input
                        label={t('wizard.apartment')}
                        value={edit.apartment}
                        maxLength={20}
                        onChange={(v) => setEdit({ ...edit, apartment: v })}
                      />
                    </div>
                    <AddressValidationNotice
                      validation={editValidation}
                      show={hasAddressInput(edit)}
                    />
                    <div className="flex flex-col justify-end gap-2 sm:flex-row">
                      <button
                        type="button"
                        onClick={() => setEditingId(null)}
                        disabled={busyId === a.id}
                        className="btn-secondary w-full sm:w-auto"
                      >
                        {t('wizardAddress.cancel')}
                      </button>
                      <button
                        type="button"
                        onClick={() => saveEdit(a)}
                        disabled={busyId === a.id || !editValidation.valid}
                        className="btn-primary w-full sm:w-auto"
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
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <CityField />
          <Input
            label={t('wizard.street')}
            value={draft.street}
            required
            maxLength={120}
            onChange={(v) => setDraft({ ...draft, street: v })}
          />
          <Input
            label={t('wizard.building')}
            value={draft.building}
            required
            maxLength={20}
            onChange={(v) => setDraft({ ...draft, building: v })}
          />
          <Input
            label={t('wizard.apartment')}
            value={draft.apartment}
            maxLength={20}
            onChange={(v) => setDraft({ ...draft, apartment: v })}
          />
          <AddressValidationNotice
            validation={draftValidation}
            show={hasAddressInput(draft)}
            className="sm:col-span-2"
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
        <span className="text-sm font-medium text-slate-700">{t('wizard.scheduledAt')}</span>
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
  const addr = addressMode === 'pick' ? addresses?.find((a) => a.id === addressId) : null;
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
      <Row label={t('wizard.scheduledAt')} value={formatDateTime(scheduledAt, locale)} />
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

function Row({ label, value, emphasize }: { label: string; value: string; emphasize?: boolean }) {
  return (
    <div className="flex flex-col gap-1 py-3 sm:flex-row sm:items-baseline sm:justify-between">
      <dt className="text-slate-500">{label}</dt>
      <dd
        className={
          emphasize
            ? 'break-words font-bold text-slate-900 sm:text-right text-lg'
            : 'break-words font-medium text-slate-900 sm:text-right'
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
  maxLength,
  className = '',
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  maxLength?: number;
  className?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="text-sm font-medium text-slate-700">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        maxLength={maxLength}
        className="input mt-1"
      />
    </label>
  );
}

function AddressValidationNotice({
  validation,
  show,
  className = '',
}: {
  validation: AddressValidation;
  show: boolean;
  className?: string;
}) {
  if (!show || validation.valid || validation.errors.length === 0) return null;
  return (
    <p className={`rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800 ${className}`}>
      {validation.errors[0]}
    </p>
  );
}

const ADDRESS_ALLOWED_PATTERN = new RegExp("^[\\p{L}\\p{M}\\p{N}\\s.'\\-/\\u2116]+$", 'u');
const HAS_LETTER_PATTERN = /\p{L}/u;
const HAS_DIGIT_PATTERN = /\d/u;
const HAS_LETTER_OR_DIGIT_PATTERN = /[\p{L}\d]/u;

function normalizeAddressDraft(draft: AddressDraft): AddressDraft {
  return {
    street: normalizeAddressPart(draft.street),
    building: normalizeAddressPart(draft.building).toUpperCase(),
    apartment: normalizeAddressPart(draft.apartment).toUpperCase(),
  };
}

function normalizeAddressPart(value: string): string {
  return value.trim().replace(/\s+/g, ' ');
}

function validateAddressDraft(draft: AddressDraft, locale: Locale): AddressValidation {
  const normalized = normalizeAddressDraft(draft);
  const errors: string[] = [];

  if (normalized.street.length < 3) {
    errors.push(addressValidationMessage('streetShort', locale));
  } else if (
    !HAS_LETTER_PATTERN.test(normalized.street) ||
    !ADDRESS_ALLOWED_PATTERN.test(normalized.street)
  ) {
    errors.push(addressValidationMessage('streetInvalid', locale));
  }

  if (normalized.building.length < 1) {
    errors.push(addressValidationMessage('buildingRequired', locale));
  } else if (
    normalized.building.length > 20 ||
    !HAS_DIGIT_PATTERN.test(normalized.building) ||
    !ADDRESS_ALLOWED_PATTERN.test(normalized.building)
  ) {
    errors.push(addressValidationMessage('buildingInvalid', locale));
  }

  if (
    normalized.apartment.length > 0 &&
    (normalized.apartment.length > 20 ||
      !HAS_LETTER_OR_DIGIT_PATTERN.test(normalized.apartment) ||
      !ADDRESS_ALLOWED_PATTERN.test(normalized.apartment))
  ) {
    errors.push(addressValidationMessage('apartmentInvalid', locale));
  }

  return { valid: errors.length === 0, errors };
}

function hasAddressInput(draft: AddressDraft): boolean {
  return Boolean(draft.street.trim() || draft.building.trim() || draft.apartment.trim());
}

function addressValidationMessage(
  key:
    | 'streetShort'
    | 'streetInvalid'
    | 'buildingRequired'
    | 'buildingInvalid'
    | 'apartmentInvalid'
    | 'invalid',
  locale: Locale,
): string {
  const messages: Record<
    Locale,
    Record<
      | 'streetShort'
      | 'streetInvalid'
      | 'buildingRequired'
      | 'buildingInvalid'
      | 'apartmentInvalid'
      | 'invalid',
      string
    >
  > = {
    ru: {
      streetShort:
        '\u0423\u043a\u0430\u0436\u0438\u0442\u0435 \u0443\u043b\u0438\u0446\u0443: \u043c\u0438\u043d\u0438\u043c\u0443\u043c 3 \u0441\u0438\u043c\u0432\u043e\u043b\u0430.',
      streetInvalid:
        '\u0423\u043b\u0438\u0446\u0430 \u043c\u043e\u0436\u0435\u0442 \u0441\u043e\u0434\u0435\u0440\u0436\u0430\u0442\u044c \u0431\u0443\u043a\u0432\u044b, \u0446\u0438\u0444\u0440\u044b, \u043f\u0440\u043e\u0431\u0435\u043b\u044b, \u0442\u043e\u0447\u043a\u0443 \u0438 \u0434\u0435\u0444\u0438\u0441.',
      buildingRequired:
        '\u0423\u043a\u0430\u0436\u0438\u0442\u0435 \u043d\u043e\u043c\u0435\u0440 \u0434\u043e\u043c\u0430.',
      buildingInvalid:
        '\u0414\u043e\u043c \u0434\u043e\u043b\u0436\u0435\u043d \u0441\u043e\u0434\u0435\u0440\u0436\u0430\u0442\u044c \u0446\u0438\u0444\u0440\u0443. \u041d\u0430\u043f\u0440\u0438\u043c\u0435\u0440: 25, 25/1, 17\u0410.',
      apartmentInvalid:
        '\u041a\u0432\u0430\u0440\u0442\u0438\u0440\u0430 \u043c\u043e\u0436\u0435\u0442 \u0441\u043e\u0434\u0435\u0440\u0436\u0430\u0442\u044c \u0431\u0443\u043a\u0432\u044b, \u0446\u0438\u0444\u0440\u044b, \u043f\u0440\u043e\u0431\u0435\u043b\u044b, \u0434\u0435\u0444\u0438\u0441 \u0438 \u0441\u043b\u044d\u0448.',
      invalid:
        '\u041f\u0440\u043e\u0432\u0435\u0440\u044c\u0442\u0435 \u0430\u0434\u0440\u0435\u0441.',
    },
    kk: {
      streetShort:
        '\u041a\u04e9\u0448\u0435\u043d\u0456 \u043a\u0435\u043c\u0456\u043d\u0434\u0435 3 \u0442\u0430\u04a3\u0431\u0430\u043c\u0435\u043d \u0435\u043d\u0433\u0456\u0437\u0456\u04a3\u0456\u0437.',
      streetInvalid:
        '\u041a\u04e9\u0448\u0435\u0434\u0435 \u04d9\u0440\u0456\u043f, \u0441\u0430\u043d, \u0431\u043e\u0441 \u043e\u0440\u044b\u043d, \u043d\u04af\u043a\u0442\u0435 \u0436\u04d9\u043d\u0435 \u0434\u0435\u0444\u0438\u0441 \u049b\u043e\u043b\u0434\u0430\u043d\u0443\u0493\u0430 \u0431\u043e\u043b\u0430\u0434\u044b.',
      buildingRequired:
        '\u04ae\u0439 \u043d\u04e9\u043c\u0456\u0440\u0456\u043d \u0435\u043d\u0433\u0456\u0437\u0456\u04a3\u0456\u0437.',
      buildingInvalid:
        '\u04ae\u0439 \u043d\u04e9\u043c\u0456\u0440\u0456\u043d\u0434\u0435 \u0441\u0430\u043d \u0431\u043e\u043b\u0443\u044b \u043a\u0435\u0440\u0435\u043a. \u041c\u044b\u0441\u0430\u043b\u044b: 25, 25/1, 17\u0410.',
      apartmentInvalid:
        '\u041f\u04d9\u0442\u0435\u0440\u0434\u0435 \u04d9\u0440\u0456\u043f, \u0441\u0430\u043d, \u0431\u043e\u0441 \u043e\u0440\u044b\u043d, \u0434\u0435\u0444\u0438\u0441 \u0436\u04d9\u043d\u0435 \u0441\u043b\u044d\u0448 \u049b\u043e\u043b\u0434\u0430\u043d\u0443\u0493\u0430 \u0431\u043e\u043b\u0430\u0434\u044b.',
      invalid:
        '\u041c\u0435\u043a\u0435\u043d\u0436\u0430\u0439\u0434\u044b \u0442\u0435\u043a\u0441\u0435\u0440\u0456\u04a3\u0456\u0437.',
    },
    en: {
      streetShort: 'Enter a street name with at least 3 characters.',
      streetInvalid: 'Street can contain letters, numbers, spaces, a dot, and a hyphen.',
      buildingRequired: 'Enter the building number.',
      buildingInvalid: 'Building must include a number. For example: 25, 25/1, 17A.',
      apartmentInvalid: 'Apartment can contain letters, numbers, spaces, hyphen, and slash.',
      invalid: 'Check the address.',
    },
  };

  return messages[locale]?.[key] ?? messages.ru[key];
}

function CityField() {
  const t = useTranslations();
  return (
    <div>
      <span className="text-sm font-medium text-slate-700">{t('wizard.city')}</span>
      <div className="input mt-1 flex items-center bg-slate-50 text-slate-700">{t('nav.city')}</div>
    </div>
  );
}

function buildDirectorOrderUrl({
  director,
  orderId,
  service,
  quote,
  areaM2,
  rooms,
  chosen,
  address,
  scheduledAt,
  notes,
  locale,
  customerPhone,
}: {
  director: DirectorSettings;
  orderId: string;
  service: Service | null;
  quote: Quote;
  areaM2: number;
  rooms: number;
  chosen: Record<string, number>;
  address: Address | AddressDraft | null;
  scheduledAt: string;
  notes: string;
  locale: Locale;
  customerPhone: string | null;
}) {
  const options =
    service?.options
      .filter((option) => (chosen[option.key] ?? 0) > 0)
      .map((option) => option.label)
      .join(', ') || 'нет';

  const lines = [
    'Новый заказ уборки',
    `Заказ: ${orderId}`,
    `Услуга: ${service?.name ?? service?.slug ?? 'не выбрана'}`,
    `Дата: ${formatDateTime(scheduledAt, locale)}`,
    `Адрес: ${formatAddressForMessage(address)}`,
    `Площадь: ${areaM2} м²`,
    `Комнаты: ${rooms}`,
    `Опции: ${options}`,
    `Комментарий: ${notes.trim() || 'нет'}`,
    `Итого: ${formatMoney(quote.total, quote.currency, locale)}`,
    customerPhone ? `Телефон клиента: ${customerPhone}` : null,
  ].filter(Boolean);

  const text = encodeURIComponent(lines.join('\n'));
  // Fall back to WhatsApp if Telegram is configured but has no username yet —
  // the director still needs to receive the order.
  const useTelegram =
    director.channel === 'telegram' && director.telegramUsername.trim().length > 0;
  if (useTelegram) {
    const username = director.telegramUsername.trim().replace(/^@+/, '');
    return `https://t.me/${username}?text=${text}`;
  }
  const phone = (director.whatsappPhone || FALLBACK_DIRECTOR.whatsappPhone).replace(/[^\d]/g, '');
  return `https://wa.me/${phone}?text=${text}`;
}

function formatAddressForMessage(address: Address | AddressDraft | null): string {
  if (!address) return 'Астана';
  const apartment = address.apartment ? `, кв. ${address.apartment}` : '';
  return `Астана, ${address.street}, ${address.building}${apartment}`;
}

function formatDateTime(value: string, locale: Locale): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString(localeToTag(locale), {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

function localeToTag(locale: Locale): string {
  if (locale === 'kk') return 'kk-KZ';
  if (locale === 'en') return 'en-US';
  return 'ru-RU';
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
