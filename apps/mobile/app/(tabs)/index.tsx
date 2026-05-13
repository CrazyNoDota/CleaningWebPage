import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { Button, Card, Chip, ErrorText, Field, Muted, Screen, Title } from '@/components/ui';
import {
  ApiError,
  createAddress,
  createOrder,
  listAddresses,
  listServices,
  quote as quoteApi,
} from '@/lib/api';
import {
  buildScheduleOptions,
  defaultScheduleInput,
  formatAddress,
  formatMoney,
  scheduleInputToIso,
  toScheduleInput,
} from '@/lib/format';
import { useSession } from '@/lib/session';
import { colors } from '@/lib/theme';
import type { Address, Quote, Service } from '@/lib/types';

export default function BookScreen() {
  const { hydrated, session } = useSession();
  const [services, setServices] = useState<Service[] | null>(null);
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [areaM2, setAreaM2] = useState('60');
  const [rooms, setRooms] = useState(2);
  const [chosen, setChosen] = useState<Record<string, number>>({});
  const [quote, setQuote] = useState<Quote | null>(null);
  const [savedAddresses, setSavedAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [street, setStreet] = useState('');
  const [building, setBuilding] = useState('');
  const [apartment, setApartment] = useState('');
  const [comment, setComment] = useState('');
  const [scheduledAt, setScheduledAt] = useState(defaultScheduleInput());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedService = useMemo(
    () => services?.find((service) => service.slug === selectedSlug) ?? null,
    [selectedSlug, services],
  );
  const scheduleOptions = useMemo(() => buildScheduleOptions(), []);
  const selectedAddress = useMemo(
    () => savedAddresses.find((address) => address.id === selectedAddressId) ?? null,
    [savedAddresses, selectedAddressId],
  );

  useEffect(() => {
    listServices('ru')
      .then((rows) => {
        setServices(rows);
        setSelectedSlug(rows[0]?.slug ?? null);
      })
      .catch((e: ApiError) => setError(e.message));
  }, []);

  useEffect(() => {
    if (!session) {
      setSavedAddresses([]);
      setSelectedAddressId(null);
      return;
    }
    listAddresses()
      .then((rows) => {
        setSavedAddresses(rows);
        setSelectedAddressId((current) => current ?? rows[0]?.id ?? null);
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

  async function submit() {
    setError(null);
    if (!hydrated) return;
    if (!session) {
      router.push({ pathname: '/login', params: { next: '/' } });
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
      router.push(`/orders/${order.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось создать заказ');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen padded={false}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Title>Заказать уборку</Title>
          <Muted>Выберите услугу, параметры квартиры и удобное время.</Muted>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Услуга</Text>
            {!services && <ActivityIndicator color={colors.brand} />}
            <View style={styles.serviceList}>
              {services?.map((service) => (
                <Pressable
                  key={service.id}
                  onPress={() => {
                    setSelectedSlug(service.slug);
                    setChosen({});
                  }}
                  style={[
                    styles.serviceCard,
                    selectedSlug === service.slug && styles.serviceCardActive,
                  ]}
                >
                  <Text style={styles.serviceName}>{service.name}</Text>
                  <Text style={styles.serviceMeta}>
                    от {formatMoney(service.basePrice, service.currency)}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          <Card>
            <View style={styles.form}>
              <Field
                label="Площадь, м²"
                value={areaM2}
                onChangeText={(v) => setAreaM2(v.replace(/[^\d]/g, ''))}
                keyboardType="number-pad"
              />
              <View style={styles.stack}>
                <Text style={styles.label}>Комнаты</Text>
                <View style={styles.rowWrap}>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Chip
                      key={n}
                      label={n === 5 ? '5+' : String(n)}
                      active={rooms === n}
                      onPress={() => setRooms(n)}
                    />
                  ))}
                </View>
              </View>
              {selectedService && selectedService.options.length > 0 && (
                <View style={styles.stack}>
                  <Text style={styles.label}>Дополнительно</Text>
                  <View style={styles.rowWrap}>
                    {selectedService.options.map((option) => {
                      const active = (chosen[option.key] ?? 0) > 0;
                      return (
                        <Chip
                          key={option.key}
                          label={`${option.label} +${formatMoney(option.priceDelta)}`}
                          active={active}
                          onPress={() =>
                            setChosen((prev) => ({ ...prev, [option.key]: active ? 0 : 1 }))
                          }
                        />
                      );
                    })}
                  </View>
                </View>
              )}
              {quote && (
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Итого</Text>
                  <Text style={styles.totalValue}>{formatMoney(quote.total, quote.currency)}</Text>
                </View>
              )}
            </View>
          </Card>

          <Card>
            <View style={styles.form}>
              <Text style={styles.sectionTitle}>Адрес и время</Text>
              {savedAddresses.length > 0 && (
                <View style={styles.stack}>
                  <Text style={styles.label}>Сохраненные адреса</Text>
                  <View style={styles.addressList}>
                    {savedAddresses.map((address) => (
                      <Pressable
                        key={address.id}
                        onPress={() => setSelectedAddressId(address.id)}
                        style={[
                          styles.addressCard,
                          selectedAddressId === address.id && styles.addressCardActive,
                        ]}
                      >
                        <Text style={styles.addressText}>{formatAddress(address)}</Text>
                      </Pressable>
                    ))}
                    <Pressable
                      onPress={() => setSelectedAddressId(null)}
                      style={[
                        styles.addressCard,
                        selectedAddressId === null && styles.addressCardActive,
                      ]}
                    >
                      <Text style={styles.addressText}>Новый адрес</Text>
                    </Pressable>
                  </View>
                </View>
              )}
              {!selectedAddressId && (
                <>
                  <Field label="Улица" value={street} onChangeText={setStreet} />
                  <Field label="Дом" value={building} onChangeText={setBuilding} />
                  <Field label="Квартира" value={apartment} onChangeText={setApartment} />
                </>
              )}
              <View style={styles.stack}>
                <Text style={styles.label}>Ближайшие слоты</Text>
                <View style={styles.rowWrap}>
                  {scheduleOptions.map((slot) => {
                    const value = toScheduleInput(slot.value);
                    return (
                      <Chip
                        key={value}
                        label={slot.label}
                        active={scheduledAt === value}
                        onPress={() => setScheduledAt(value)}
                      />
                    );
                  })}
                </View>
              </View>
              <Field
                label="Дата и время"
                value={scheduledAt}
                onChangeText={setScheduledAt}
                placeholder="2026-06-01 10:00"
              />
              <Field
                label="Комментарий"
                value={comment}
                onChangeText={setComment}
                multiline
                placeholder="Домофон, подъезд, пожелания"
              />
              <ErrorText>{error}</ErrorText>
              <Button onPress={submit} disabled={busy || !selectedSlug}>
                {busy ? 'Создаем заказ...' : session ? 'Создать заказ' : 'Войти и продолжить'}
              </Button>
            </View>
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  content: {
    gap: 16,
    padding: 16,
    paddingBottom: 32,
  },
  section: {
    gap: 10,
  },
  sectionTitle: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: '800',
  },
  serviceList: {
    gap: 10,
  },
  serviceCard: {
    backgroundColor: colors.card,
    borderColor: colors.faint,
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
  },
  serviceCardActive: {
    backgroundColor: colors.brandSoft,
    borderColor: colors.brand,
  },
  serviceName: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: '800',
  },
  serviceMeta: {
    color: colors.muted,
    fontSize: 13,
    marginTop: 4,
  },
  form: {
    gap: 14,
  },
  stack: {
    gap: 8,
  },
  label: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: '700',
  },
  rowWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  addressList: {
    gap: 8,
  },
  addressCard: {
    backgroundColor: '#ffffff',
    borderColor: colors.faint,
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
  },
  addressCardActive: {
    backgroundColor: colors.brandSoft,
    borderColor: colors.brand,
  },
  addressText: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: '700',
  },
  totalRow: {
    alignItems: 'center',
    borderTopColor: colors.faint,
    borderTopWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 14,
  },
  totalLabel: {
    color: colors.muted,
    fontWeight: '700',
  },
  totalValue: {
    color: colors.ink,
    fontSize: 22,
    fontWeight: '900',
  },
});
