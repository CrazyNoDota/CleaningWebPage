import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import {
  BottomActionBar,
  Button,
  ErrorText,
  Field,
  PriceBlock,
  Screen,
} from '@/components/ui';
import {
  ApiError,
  createAddress,
  createOrder,
  listAddresses,
  listServices,
  quote as quoteApi,
} from '@/lib/api';
import {
  defaultScheduleInput,
  formatAddress,
  formatMoney,
  scheduleInputToIso,
} from '@/lib/format';
import { useSession } from '@/lib/session';
import { useTheme } from '@/lib/theme-provider';
import type { Address, Quote, Service } from '@/lib/types';

// Local cover photos fallback by slug (used when service.photoUrl is null)
const CATEGORY_IMAGES: Record<string, number> = {
  'apartment-standard': require('../../assets/img/cat_standard.png'),
  'apartment-deep': require('../../assets/img/cat_deep.png'),
  'post-renovation': require('../../assets/img/cat_post_renovation.png'),
  office: require('../../assets/img/cat_office.png'),
};
const CATEGORY_FALLBACK = require('../../assets/img/cat_standard.png');

function serviceImage(service: { slug: string; photoUrl: string | null }) {
  if (service.photoUrl) return { uri: service.photoUrl };
  return CATEGORY_IMAGES[service.slug] ?? CATEGORY_FALLBACK;
}

const WEEKDAYS_SHORT = ['ВС', 'ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ'];
const MONTHS_SHORT = ['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
const TIME_HOURS = [9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];
const DAYS_AHEAD = 14;

type DayOption = {
  key: string;
  date: Date;
  weekday: string;
  dayNum: number;
  month: string;
  isToday: boolean;
  isTomorrow: boolean;
};

// Module-scoped draft so the form survives unmount when the user is sent to
// /login and brought back via router.replace('/book').
type BookingDraft = {
  selectedSlug: string | null;
  areaM2: string;
  rooms: number;
  chosen: Record<string, number>;
  selectedAddressId: string | null;
  street: string;
  building: string;
  apartment: string;
  comment: string;
  scheduledAt: string;
  selectedDayKey: string;
};

let bookingDraft: Partial<BookingDraft> = {};

function clearBookingDraft() {
  bookingDraft = {};
}

function buildDayOptions(now = new Date()): DayOption[] {
  const out: DayOption[] = [];
  for (let i = 0; i < DAYS_AHEAD; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() + i);
    d.setHours(0, 0, 0, 0);
    out.push({
      key: `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`,
      date: d,
      weekday: WEEKDAYS_SHORT[d.getDay()],
      dayNum: d.getDate(),
      month: MONTHS_SHORT[d.getMonth()],
      isToday: i === 0,
      isTomorrow: i === 1,
    });
  }
  return out;
}

function buildTimeSlots(day: Date, now = new Date()): Array<{ time: string; value: string; disabled: boolean }> {
  const isToday = day.toDateString() === now.toDateString();
  return TIME_HOURS.map((hour) => {
    const slot = new Date(day);
    slot.setHours(hour, 0, 0, 0);
    const disabled = isToday && slot.getTime() <= now.getTime() + 2 * 60 * 60 * 1000;
    const pad = (n: number) => String(n).padStart(2, '0');
    return {
      time: `${pad(hour)}:00`,
      value: `${slot.getFullYear()}-${pad(slot.getMonth() + 1)}-${pad(slot.getDate())} ${pad(hour)}:00`,
      disabled,
    };
  });
}

export default function BookScreen() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ slug?: string }>();
  const { hydrated, session } = useSession();
  const [services, setServices] = useState<Service[] | null>(null);
  const [selectedSlug, setSelectedSlug] = useState<string | null>(() => bookingDraft.selectedSlug ?? null);
  const [areaM2, setAreaM2] = useState(() => bookingDraft.areaM2 ?? '60');
  const [rooms, setRooms] = useState(() => bookingDraft.rooms ?? 2);
  const [chosen, setChosen] = useState<Record<string, number>>(() => bookingDraft.chosen ?? {});
  const [quote, setQuote] = useState<Quote | null>(null);
  const [savedAddresses, setSavedAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(() => bookingDraft.selectedAddressId ?? null);
  const [street, setStreet] = useState(() => bookingDraft.street ?? '');
  const [building, setBuilding] = useState(() => bookingDraft.building ?? '');
  const [apartment, setApartment] = useState(() => bookingDraft.apartment ?? '');
  const [comment, setComment] = useState(() => bookingDraft.comment ?? '');
  const [scheduledAt, setScheduledAt] = useState(() => bookingDraft.scheduledAt ?? defaultScheduleInput());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedService = useMemo(
    () => services?.find((s) => s.slug === selectedSlug) ?? null,
    [selectedSlug, services],
  );

  const dayOptions = useMemo(() => buildDayOptions(), []);
  const [selectedDayKey, setSelectedDayKey] = useState<string>(() => {
    const fromDraft = bookingDraft.selectedDayKey;
    if (fromDraft && dayOptions.some((d) => d.key === fromDraft)) return fromDraft;
    return dayOptions[1]?.key ?? dayOptions[0]?.key ?? '';
  });
  const selectedDay = useMemo(
    () => dayOptions.find((d) => d.key === selectedDayKey) ?? dayOptions[0],
    [dayOptions, selectedDayKey],
  );
  const timeSlots = useMemo(
    () => (selectedDay ? buildTimeSlots(selectedDay.date) : []),
    [selectedDay],
  );

  useEffect(() => {
    listServices('ru')
      .then((rows) => {
        setServices(rows);
        const preferred = params.slug && rows.find((r) => r.slug === params.slug)?.slug;
        setSelectedSlug((current) => {
          if (preferred) return preferred;
          if (current && rows.some((r) => r.slug === current)) return current;
          return rows[0]?.slug ?? null;
        });
      })
      .catch((e: ApiError) => setError(e.message));
  }, [params.slug]);

  useEffect(() => {
    if (!session) {
      setSavedAddresses([]);
      setSelectedAddressId(null);
      return;
    }
    listAddresses()
      .then((rows) => {
        setSavedAddresses(rows);
        setSelectedAddressId((current) => {
          if (current && rows.some((r) => r.id === current)) return current;
          return current ?? rows[0]?.id ?? null;
        });
      })
      .catch(() => undefined);
  }, [session]);

  useEffect(() => {
    if (!selectedSlug) return;
    const area = Number(areaM2);
    if (!Number.isFinite(area) || area <= 0) return;
    const options = Object.entries(chosen)
      .filter(([, qty]) => qty > 0)
      .map(([key, qty]) => ({ key, qty }));
    const handle = setTimeout(() => {
      quoteApi({
        serviceSlug: selectedSlug,
        inputs: { area_m2: area, rooms },
        options,
      })
        .then(setQuote)
        .catch((e: ApiError) => setError(e.message));
    }, 250);
    return () => clearTimeout(handle);
  }, [areaM2, chosen, rooms, selectedSlug]);

  const selectedAddress = useMemo(
    () => savedAddresses.find((a) => a.id === selectedAddressId) ?? null,
    [savedAddresses, selectedAddressId],
  );

  bookingDraft = {
    selectedSlug,
    areaM2,
    rooms,
    chosen,
    selectedAddressId,
    street,
    building,
    apartment,
    comment,
    scheduledAt,
    selectedDayKey,
  };

  async function submit() {
    setError(null);
    if (!hydrated) return;
    if (!session) {
      router.push({ pathname: '/login', params: { next: '/book' } });
      return;
    }
    if (!selectedSlug) {
      setError('Выберите услугу');
      return;
    }
    if (!selectedAddress && (!street.trim() || !building.trim())) {
      setError('Введите улицу и дом');
      return;
    }

    setBusy(true);
    try {
      const addressId = selectedAddress
        ? selectedAddress.id
        : (
            await createAddress({
              city: 'astana',
              street: street.trim(),
              building: building.trim(),
              apartment: apartment.trim() || undefined,
              comment: comment.trim() || undefined,
            })
          ).id;
      const options = Object.entries(chosen)
        .filter(([, qty]) => qty > 0)
        .map(([key, qty]) => ({ key, qty }));
      const order = await createOrder({
        serviceSlug: selectedSlug,
        scheduledAt: scheduleInputToIso(scheduledAt),
        addressId,
        inputs: { area_m2: Number(areaM2), rooms },
        options,
        notes: comment.trim() || undefined,
        source: 'mobile',
      });
      clearBookingDraft();
      router.push({ pathname: '/booking-confirmation', params: { orderId: order.id } });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось создать заказ');
    } finally {
      setBusy(false);
    }
  }

  const totalMinor = quote?.total ?? selectedService?.basePrice ?? 0;
  const totalLabel = quote?.total != null
    ? formatMoney(quote.total, quote.currency)
    : selectedService
      ? `от ${formatMoney(selectedService.basePrice, selectedService.currency)}`
      : '—';

  return (
    <Screen padded={false}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: t.space[4],
            paddingTop: insets.top + t.space[5],
            paddingBottom: 120,
            gap: t.space[7],
          }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Hero PriceBlock */}
          <View style={{ alignItems: 'center', gap: t.space[2] }}>
            <Text
              style={{
                color: t.color.ink.secondary,
                fontSize: t.type.labelSm.fontSize,
                lineHeight: t.type.labelSm.lineHeight,
                fontWeight: t.type.labelSm.fontWeight,
                letterSpacing: 1.6,
                textTransform: 'uppercase',
              }}
            >
              Итого к оплате
            </Text>
            <PriceBlock amount={Math.round(totalMinor / 100)} />
          </View>

          {/* Service selector */}
          <Section title="Выберите тип уборки" theme={t}>
            {!services && <ActivityIndicator color={t.color.brand[500]} />}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: t.space[4], paddingRight: t.space[4] }}
            >
              {services?.map((service) => {
                const active = selectedSlug === service.slug;
                return (
                  <Pressable
                    key={service.id}
                    onPress={() => {
                      setSelectedSlug(service.slug);
                      setChosen({});
                    }}
                    style={({ pressed }) => ({
                      width: 240,
                      borderRadius: t.radius.lg,
                      backgroundColor: t.color.bg.surface,
                      borderWidth: 2,
                      borderColor: active ? t.color.brand[500] : 'transparent',
                      opacity: active ? 1 : 0.78,
                      transform: [{ scale: pressed ? 0.98 : 1 }],
                      overflow: 'hidden',
                    })}
                  >
                    <ImageBackground
                      source={serviceImage(service)}
                      resizeMode="cover"
                      style={{
                        aspectRatio: 16 / 9,
                        backgroundColor: t.color.bg.sunken,
                      }}
                    >
                      {active && (
                        <View
                          style={{
                            position: 'absolute',
                            top: t.space[3],
                            right: t.space[3],
                            width: 28,
                            height: 28,
                            borderRadius: 14,
                            backgroundColor: t.color.brand[500],
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Text style={{ color: t.color.ink.onBrand, fontWeight: '700' }}>✓</Text>
                        </View>
                      )}
                    </ImageBackground>
                    <View style={{ padding: t.space[4], gap: t.space[1] }}>
                      <Text
                        style={{
                          color: active ? t.color.brand[500] : t.color.ink.primary,
                          fontSize: t.type.titleSm.fontSize,
                          lineHeight: t.type.titleSm.lineHeight,
                          fontWeight: t.type.titleSm.fontWeight,
                        }}
                      >
                        {service.name}
                      </Text>
                      <Text
                        style={{
                          color: t.color.ink.secondary,
                          fontSize: t.type.bodySm.fontSize,
                          lineHeight: t.type.bodySm.lineHeight,
                        }}
                      >
                        от {formatMoney(service.basePrice, service.currency)}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </ScrollView>
          </Section>

          {/* Steppers row */}
          <View style={{ flexDirection: 'row', gap: t.space[3] }}>
            <StepperCard
              theme={t}
              label="Комнаты"
              value={rooms}
              onChange={(n) => setRooms(Math.max(1, Math.min(10, n)))}
              suffix={rooms >= 5 ? '+' : ''}
            />
            <View
              style={{
                flex: 1,
                backgroundColor: t.color.bg.sunken,
                borderRadius: t.radius.lg,
                padding: t.space[4],
                gap: t.space[3],
              }}
            >
              <Text
                style={{
                  color: t.color.ink.primary,
                  fontSize: t.type.labelLg.fontSize,
                  lineHeight: t.type.labelLg.lineHeight,
                  fontWeight: t.type.labelLg.fontWeight,
                }}
              >
                Площадь, м²
              </Text>
              <TextInput
                value={areaM2}
                onChangeText={(v) => setAreaM2(v.replace(/[^\d]/g, ''))}
                keyboardType="number-pad"
                placeholder="60"
                placeholderTextColor={t.color.ink.tertiary}
                style={{
                  color: t.color.ink.primary,
                  fontSize: t.type.titleLg.fontSize,
                  lineHeight: t.type.titleLg.lineHeight,
                  fontWeight: '700',
                  padding: 0,
                }}
              />
            </View>
          </View>

          {/* Date + time picker */}
          <Section title="Дата и время" theme={t}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: t.space[2], paddingRight: t.space[4] }}
            >
              {dayOptions.map((d) => {
                const active = selectedDayKey === d.key;
                const label = d.isToday ? 'СЕГОДНЯ' : d.isTomorrow ? 'ЗАВТРА' : d.weekday;
                return (
                  <Pressable
                    key={d.key}
                    onPress={() => setSelectedDayKey(d.key)}
                    style={{
                      width: 64,
                      paddingVertical: t.space[3],
                      borderRadius: t.radius.lg,
                      backgroundColor: active ? t.color.brand[500] : t.color.bg.sunken,
                      borderWidth: 1,
                      borderColor: active ? t.color.brand[500] : 'transparent',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 2,
                    }}
                  >
                    <Text
                      style={{
                        color: active ? t.color.ink.onBrand : t.color.ink.secondary,
                        fontSize: 10,
                        fontWeight: '700',
                        letterSpacing: 0.5,
                      }}
                    >
                      {label}
                    </Text>
                    <Text
                      style={{
                        color: active ? t.color.ink.onBrand : t.color.ink.primary,
                        fontSize: 22,
                        fontWeight: '800',
                        fontVariant: ['tabular-nums'],
                      }}
                    >
                      {d.dayNum}
                    </Text>
                    <Text
                      style={{
                        color: active ? t.color.ink.onBrand : t.color.ink.tertiary,
                        fontSize: 11,
                        fontWeight: '600',
                      }}
                    >
                      {d.month}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: t.space[2] }}>
              {timeSlots.map((slot) => {
                const active = scheduledAt === slot.value;
                return (
                  <Pressable
                    key={slot.value}
                    onPress={() => !slot.disabled && setScheduledAt(slot.value)}
                    disabled={slot.disabled}
                    style={{
                      flexBasis: '22%',
                      flexGrow: 1,
                      paddingVertical: t.space[3],
                      borderRadius: t.radius.md,
                      borderWidth: 1,
                      borderColor: active ? t.color.brand[500] : t.color.line.hairline,
                      backgroundColor: active ? t.color.brand[100] : 'transparent',
                      opacity: slot.disabled ? 0.35 : 1,
                      alignItems: 'center',
                    }}
                  >
                    <Text
                      style={{
                        color: active ? t.color.brand[500] : t.color.ink.primary,
                        fontSize: t.type.labelLg.fontSize,
                        lineHeight: t.type.labelLg.lineHeight,
                        fontWeight: '700',
                        fontVariant: ['tabular-nums'],
                      }}
                    >
                      {slot.time}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </Section>

          {/* Address */}
          <Section title="Адрес в Астане" theme={t}>
            {savedAddresses.length > 0 && (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: t.space[2] }}>
                {savedAddresses.map((address) => {
                  const active = selectedAddressId === address.id;
                  return (
                    <Pressable
                      key={address.id}
                      onPress={() => setSelectedAddressId(address.id)}
                      style={{
                        paddingHorizontal: t.space[4],
                        paddingVertical: t.space[3],
                        borderRadius: t.radius.md,
                        borderWidth: 1,
                        borderColor: active ? t.color.brand[500] : t.color.line.hairline,
                        backgroundColor: active ? t.color.brand[100] : 'transparent',
                      }}
                    >
                      <Text
                        style={{
                          color: active ? t.color.brand[500] : t.color.ink.primary,
                          fontSize: t.type.bodySm.fontSize,
                          lineHeight: t.type.bodySm.lineHeight,
                          fontWeight: '600',
                        }}
                      >
                        {formatAddress(address)}
                      </Text>
                    </Pressable>
                  );
                })}
                <Pressable
                  onPress={() => setSelectedAddressId(null)}
                  style={{
                    paddingHorizontal: t.space[4],
                    paddingVertical: t.space[3],
                    borderRadius: t.radius.md,
                    borderWidth: 1,
                    borderStyle: 'dashed',
                    borderColor:
                      selectedAddressId === null ? t.color.brand[500] : t.color.line.hairline,
                  }}
                >
                  <Text
                    style={{
                      color:
                        selectedAddressId === null ? t.color.brand[500] : t.color.ink.secondary,
                      fontSize: t.type.bodySm.fontSize,
                      lineHeight: t.type.bodySm.lineHeight,
                      fontWeight: '600',
                    }}
                  >
                    + Новый адрес
                  </Text>
                </Pressable>
              </View>
            )}
            {!selectedAddressId && (
              <View style={{ gap: t.space[3] }}>
                <SunkenInput
                  theme={t}
                  value={street}
                  onChangeText={setStreet}
                  placeholder="Улица и номер дома"
                />
                <View style={{ flexDirection: 'row', gap: t.space[3] }}>
                  <View style={{ flex: 1 }}>
                    <SunkenInput
                      theme={t}
                      value={building}
                      onChangeText={setBuilding}
                      placeholder="Подъезд"
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <SunkenInput
                      theme={t}
                      value={apartment}
                      onChangeText={setApartment}
                      placeholder="Кв / Офис"
                    />
                  </View>
                </View>
              </View>
            )}
          </Section>

          {/* Extra options */}
          {selectedService && selectedService.options.length > 0 && (
            <Section title="Дополнительно" theme={t}>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: t.space[3] }}>
                {selectedService.options.map((option) => {
                  const active = (chosen[option.key] ?? 0) > 0;
                  return (
                    <Pressable
                      key={option.key}
                      onPress={() =>
                        setChosen((prev) => ({ ...prev, [option.key]: active ? 0 : 1 }))
                      }
                      style={({ pressed }) => ({
                        flexBasis: '47%',
                        flexGrow: 1,
                        padding: t.space[4],
                        borderRadius: t.radius.md,
                        borderWidth: 1,
                        borderColor: active ? t.color.brand[500] : t.color.line.hairline,
                        backgroundColor: active ? t.color.brand[100] : t.color.bg.surface,
                        gap: t.space[2],
                        transform: [{ scale: pressed ? 0.97 : 1 }],
                      })}
                    >
                      <Text
                        style={{
                          color: active ? t.color.brand[500] : t.color.ink.primary,
                          fontSize: t.type.labelLg.fontSize,
                          lineHeight: t.type.labelLg.lineHeight,
                          fontWeight: t.type.labelLg.fontWeight,
                        }}
                      >
                        {option.label}
                      </Text>
                      <Text
                        style={{
                          color: t.color.ink.secondary,
                          fontSize: t.type.bodySm.fontSize,
                          lineHeight: t.type.bodySm.lineHeight,
                        }}
                      >
                        + {formatMoney(option.priceDelta)}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </Section>
          )}

          {/* Comment */}
          <Field
            label="Комментарий"
            value={comment}
            onChangeText={setComment}
            multiline
            placeholder="Домофон, подъезд, пожелания"
          />

          {error && <ErrorText>{error}</ErrorText>}
        </ScrollView>

        <BottomActionBar>
          <Button onPress={submit} disabled={busy || !selectedSlug}>
            {busy
              ? 'Создаем заказ...'
              : session
                ? `Забронировать за ${totalLabel}`
                : 'Войти и продолжить'}
          </Button>
        </BottomActionBar>
      </KeyboardAvoidingView>
    </Screen>
  );
}

function Section({
  title,
  children,
  theme,
}: {
  title: string;
  children: React.ReactNode;
  theme: ReturnType<typeof useTheme>;
}) {
  return (
    <View style={{ gap: theme.space[3] }}>
      <Text
        style={{
          color: theme.color.ink.primary,
          fontSize: theme.type.titleMd.fontSize,
          lineHeight: theme.type.titleMd.lineHeight,
          fontWeight: theme.type.titleMd.fontWeight,
          paddingHorizontal: theme.space[1],
        }}
      >
        {title}
      </Text>
      {children}
    </View>
  );
}

function StepperCard({
  theme,
  label,
  value,
  onChange,
  suffix = '',
}: {
  theme: ReturnType<typeof useTheme>;
  label: string;
  value: number;
  onChange: (n: number) => void;
  suffix?: string;
}) {
  const t = theme;
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: t.color.bg.sunken,
        borderRadius: t.radius.lg,
        padding: t.space[4],
        gap: t.space[3],
      }}
    >
      <Text
        style={{
          color: t.color.ink.primary,
          fontSize: t.type.labelLg.fontSize,
          lineHeight: t.type.labelLg.lineHeight,
          fontWeight: t.type.labelLg.fontWeight,
        }}
      >
        {label}
      </Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <StepperButton theme={t} onPress={() => onChange(value - 1)} variant="ghost">−</StepperButton>
        <Text
          style={{
            color: t.color.ink.primary,
            fontSize: t.type.titleLg.fontSize,
            lineHeight: t.type.titleLg.lineHeight,
            fontWeight: t.type.titleLg.fontWeight,
            fontVariant: ['tabular-nums'],
          }}
        >
          {value}
          {suffix}
        </Text>
        <StepperButton theme={t} onPress={() => onChange(value + 1)} variant="primary">+</StepperButton>
      </View>
    </View>
  );
}

function StepperButton({
  theme,
  children,
  onPress,
  variant,
}: {
  theme: ReturnType<typeof useTheme>;
  children: React.ReactNode;
  onPress: () => void;
  variant: 'primary' | 'ghost';
}) {
  const t = theme;
  const primary = variant === 'primary';
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: primary ? t.color.brand[500] : t.color.bg.surface,
        alignItems: 'center',
        justifyContent: 'center',
        transform: [{ scale: pressed ? 0.94 : 1 }],
      })}
    >
      <Text
        style={{
          color: primary ? t.color.ink.onBrand : t.color.brand[500],
          fontSize: 20,
          lineHeight: 22,
          fontWeight: '700',
        }}
      >
        {children}
      </Text>
    </Pressable>
  );
}

function SunkenInput({
  theme,
  ...props
}: {
  theme: ReturnType<typeof useTheme>;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
}) {
  const t = theme;
  return (
    <TextInput
      {...props}
      placeholderTextColor={t.color.ink.tertiary}
      style={{
        backgroundColor: t.color.bg.sunken,
        borderRadius: t.radius.lg,
        color: t.color.ink.primary,
        fontSize: t.type.bodyLg.fontSize,
        lineHeight: t.type.bodyLg.lineHeight,
        minHeight: 56,
        paddingHorizontal: t.space[4],
      }}
    />
  );
}
