import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Linking, Pressable, ScrollView, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Check, MapPin, MessageCircle, Phone, ShieldCheck, Star } from 'lucide-react-native';
import { io, type Socket } from 'socket.io-client';
import { BottomActionBar, Button, ErrorText, Muted, Screen, StatusChip, Title } from '@/components/ui';
import {
  ApiError,
  WS_BASE,
  confirmStubPayment,
  getOrder,
  getOrderCleaner,
  getPaymentStatus,
  initiatePayment,
  listAddresses,
} from '@/lib/api';
import { loadSession } from '@/lib/auth';
import { openPaymentAndAwait } from '@/lib/payment-flow';
import { formatAddress, formatMoney, localeTag, statusLabel } from '@/lib/format';
import { useSession } from '@/lib/session';
import { useTheme } from '@/lib/theme-provider';
import type { Address, CleanerCard, Order, OrderStatus } from '@/lib/types';

const TIMELINE: { status: OrderStatus; label: string }[] = [
  { status: 'created', label: 'Заказ размещён' },
  { status: 'paid', label: 'Подтверждено' },
  { status: 'assigned', label: 'Клинер назначен' },
  { status: 'en_route', label: 'Клинер в пути' },
  { status: 'in_progress', label: 'Выполняется' },
  { status: 'done', label: 'Завершено' },
];

export default function OrderDetailsScreen() {
  const t = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { session } = useSession();
  const [order, setOrder] = useState<Order | null>(null);
  const [cleaner, setCleaner] = useState<CleanerCard | null>(null);
  const [addresses, setAddresses] = useState<Address[] | null>(null);
  const [live, setLive] = useState(false);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!session || !id) return;
    getOrder(id)
      .then(setOrder)
      .catch((e: ApiError) => setError(e.message));
    getOrderCleaner(id, 'ru')
      .then((res) => setCleaner(res.cleaner))
      .catch(() => undefined);
    // The customer order endpoint returns only `addressId`; resolve the full
    // address from the user's saved addresses (same source as the booking flow).
    listAddresses()
      .then(setAddresses)
      .catch(() => setAddresses([]));
  }, [id, session]);

  useEffect(() => {
    if (!session || !id) return;
    const socket: Socket = io(`${WS_BASE}/realtime`, {
      // Read the freshest token on every (re)connection attempt so a mid-session
      // token refresh doesn't leave the socket authenticating with a stale token.
      auth: (cb) => {
        loadSession()
          .then((s) => cb({ token: s?.accessToken ?? session.accessToken }))
          .catch(() => cb({ token: session.accessToken }));
      },
      transports: ['websocket'],
      reconnection: true,
    });
    socket.on('connect', () => {
      setLive(true);
      socket.emit('subscribe-order', { orderId: id });
    });
    socket.on('order.updated', (msg: { status: OrderStatus; eventType: string }) => {
      setOrder((prev) => (prev ? { ...prev, status: msg.status } : prev));
      if (msg.eventType === 'order.assigned') {
        getOrderCleaner(id, 'ru')
          .then((res) => setCleaner(res.cleaner))
          .catch(() => undefined);
      }
    });
    socket.on('disconnect', () => setLive(false));
    return () => {
      socket.disconnect();
    };
  }, [id, session]);

  const stepIndex = useMemo(() => {
    if (!order) return -1;
    return TIMELINE.findIndex((s) => s.status === order.status);
  }, [order]);

  const address = useMemo(
    () => (order?.addressId ? addresses?.find((a) => a.id === order.addressId) ?? null : null),
    [addresses, order],
  );

  async function pay() {
    if (!order) return;
    setPaying(true);
    setError(null);
    try {
      const payment = await initiatePayment(order.id, `mobile-${order.id}`);
      if (payment.nextAction === 'stub_confirm') {
        await confirmStubPayment(payment.id);
      } else if (payment.nextAction === 'redirect' && payment.paymentUrl) {
        const final = await openPaymentAndAwait(payment.paymentUrl, payment.id, getPaymentStatus);
        if (final.status === 'failed' || final.status === 'expired' || final.status === 'cancelled') {
          setError('Оплата не прошла. Попробуйте ещё раз.');
        }
      }
      setOrder(await getOrder(order.id));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Не удалось оплатить');
    } finally {
      setPaying(false);
    }
  }

  const showPayBar = order?.status === 'created';

  return (
    <Screen padded={false}>
      <ScrollView contentContainerStyle={{ padding: t.space[4], paddingBottom: showPayBar ? 140 : t.space[8], gap: t.space[4] }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Pressable onPress={() => router.back()} hitSlop={10} style={{ flexDirection: 'row', alignItems: 'center', gap: t.space[2] }}>
            <ArrowLeft color={t.color.brand[500]} size={20} strokeWidth={2} />
            <Text style={{ color: t.color.brand[500], fontSize: t.type.labelLg.fontSize, fontWeight: t.type.labelLg.fontWeight }}>Назад</Text>
          </Pressable>
          {live && (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
                backgroundColor: t.color.brand[100],
                paddingHorizontal: t.space[3],
                paddingVertical: 4,
                borderRadius: t.radius.pill,
              }}
            >
              <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: t.color.brand[500] }} />
              <Text style={{ color: t.color.brand[500], fontSize: t.type.labelSm.fontSize, fontWeight: t.type.labelSm.fontWeight }}>Live</Text>
            </View>
          )}
        </View>

        <ErrorText>{error}</ErrorText>

        {!order && !error && <ActivityIndicator color={t.color.brand[500]} />}

        {order && (
          <>
            <View style={{ gap: t.space[2] }}>
              <Title>Заказ #{order.id.slice(0, 6).toUpperCase()}</Title>
              <StatusChip label={statusLabel(order.status)} tone={order.status === 'created' ? 'warn' : 'brand'} />
            </View>

            <Timeline stepIndex={stepIndex} order={order} />

            <CleanerBlock cleaner={cleaner} />

            <AddressBlock order={order} address={address} resolving={addresses === null} />

            <SummaryBlock order={order} />
          </>
        )}
      </ScrollView>

      {showPayBar && (
        <BottomActionBar>
          <Button onPress={pay} disabled={paying}>
            {paying ? 'Обработка…' : `Оплатить ${formatMoney(order!.total, order!.currency)}`}
          </Button>
        </BottomActionBar>
      )}
    </Screen>
  );
}

function Timeline({ stepIndex, order }: { stepIndex: number; order: Order }) {
  const t = useTheme();
  return (
    <View
      style={{
        backgroundColor: t.color.bg.surface,
        borderColor: t.color.line.hairline,
        borderRadius: t.radius.lg,
        borderWidth: 1,
        padding: t.space[4],
        gap: t.space[3],
      }}
    >
      <Text style={{ color: t.color.ink.primary, fontSize: t.type.titleSm.fontSize, fontWeight: t.type.titleSm.fontWeight }}>
        Статус заказа
      </Text>
      <View style={{ gap: t.space[4] }}>
        {TIMELINE.map((step, i) => {
          const done = i < stepIndex;
          const current = i === stepIndex;
          const upcoming = i > stepIndex;
          const dotBg = done || current ? t.color.brand[500] : t.color.line.hairline;
          const labelColor = upcoming ? t.color.ink.tertiary : t.color.ink.primary;
          const isLast = i === TIMELINE.length - 1;
          return (
            <View key={step.status} style={{ flexDirection: 'row', gap: t.space[3], alignItems: 'flex-start' }}>
              <View style={{ alignItems: 'center', width: 20 }}>
                <View
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: 9,
                    backgroundColor: dotBg,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {done && <Check color={t.color.ink.onBrand} size={12} strokeWidth={3} />}
                  {current && <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: t.color.ink.onBrand }} />}
                </View>
                {!isLast && (
                  <View
                    style={{
                      width: 2,
                      flex: 1,
                      minHeight: 16,
                      marginTop: 4,
                      backgroundColor: done ? t.color.brand[500] : t.color.line.hairline,
                    }}
                  />
                )}
              </View>
              <View style={{ flex: 1, gap: 2, paddingBottom: isLast ? 0 : t.space[3] }}>
                <Text
                  style={{
                    color: labelColor,
                    fontSize: t.type.labelLg.fontSize,
                    fontWeight: current ? t.type.titleSm.fontWeight : t.type.labelLg.fontWeight,
                  }}
                >
                  {step.label}
                </Text>
                {current && order.scheduledAt && step.status !== 'created' && (
                  <Text style={{ color: t.color.ink.secondary, fontSize: t.type.bodySm.fontSize }}>
                    {new Date(order.scheduledAt).toLocaleString(localeTag('ru'), { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </Text>
                )}
                {step.status === 'created' && (
                  <Text style={{ color: t.color.ink.secondary, fontSize: t.type.bodySm.fontSize }}>
                    {new Date(order.createdAt).toLocaleString(localeTag('ru'), { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </Text>
                )}
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

function CleanerBlock({ cleaner }: { cleaner: CleanerCard | null }) {
  const t = useTheme();
  if (!cleaner) {
    return (
      <View
        style={{
          backgroundColor: t.color.bg.surface,
          borderColor: t.color.line.hairline,
          borderRadius: t.radius.lg,
          borderWidth: 1,
          padding: t.space[4],
          gap: t.space[2],
        }}
      >
        <Text style={{ color: t.color.ink.primary, fontSize: t.type.titleSm.fontSize, fontWeight: t.type.titleSm.fontWeight }}>
          Клинер
        </Text>
        <Muted>Клинер ещё не назначен.</Muted>
      </View>
    );
  }
  return (
    <View
      style={{
        backgroundColor: t.color.bg.surface,
        borderColor: t.color.line.hairline,
        borderRadius: t.radius.lg,
        borderWidth: 1,
        padding: t.space[4],
        gap: t.space[3],
      }}
    >
      <View style={{ flexDirection: 'row', gap: t.space[3], alignItems: 'center' }}>
        <View
          style={{
            width: 56,
            height: 56,
            borderRadius: 28,
            backgroundColor: t.color.brand[100],
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ color: t.color.brand[500], fontSize: 24, fontWeight: '700' }}>
            {cleaner.displayName.charAt(0)}
          </Text>
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text
              style={{
                color: t.color.ink.primary,
                fontSize: t.type.titleSm.fontSize,
                fontWeight: t.type.titleSm.fontWeight,
              }}
            >
              {cleaner.displayName}
            </Text>
            {cleaner.verified && <ShieldCheck color={t.color.brand[500]} size={16} strokeWidth={2} />}
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.space[2] }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Star color={t.color.accent[500]} size={14} fill={t.color.accent[500]} />
              <Text style={{ color: t.color.ink.primary, fontSize: t.type.labelSm.fontSize, fontWeight: '600' }}>
                {cleaner.ratingAvg.toFixed(2)}
              </Text>
            </View>
            <Muted>({cleaner.ratingCount} отзывов)</Muted>
          </View>
        </View>
      </View>
      <View style={{ flexDirection: 'row', gap: t.space[3] }}>
        <IconAction icon={<MessageCircle color={t.color.brand[500]} size={18} strokeWidth={2} />} label="Чат" />
        <IconAction
          icon={<Phone color={cleaner.phone ? t.color.brand[500] : t.color.ink.tertiary} size={18} strokeWidth={2} />}
          label="Звонок"
          disabled={!cleaner.phone}
          onPress={() => callCleaner(cleaner.phone)}
        />
      </View>
    </View>
  );
}

async function callCleaner(phone: string | null | undefined) {
  if (!phone) return;
  // Strip spaces/parens/dashes so `tel:` gets a clean dialable value.
  const sanitized = phone.replace(/[^\d+]/g, '');
  if (!sanitized) return;
  const url = `tel:${sanitized}`;
  try {
    const supported = await Linking.canOpenURL(url);
    if (!supported) {
      Alert.alert('Звонок недоступен', 'На этом устройстве нельзя совершить звонок.');
      return;
    }
    await Linking.openURL(url);
  } catch {
    Alert.alert('Ошибка', 'Не удалось открыть звонилку.');
  }
}

function IconAction({
  icon,
  label,
  onPress,
  disabled,
}: {
  icon: React.ReactNode;
  label: string;
  onPress?: () => void;
  disabled?: boolean;
}) {
  const t = useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={{
        flex: 1,
        flexDirection: 'row',
        gap: t.space[2],
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: t.space[3],
        borderRadius: t.radius.md,
        borderWidth: 1,
        borderColor: t.color.line.hairline,
        backgroundColor: t.color.bg.surface,
        opacity: disabled ? 0.45 : 1,
      }}
    >
      {icon}
      <Text style={{ color: disabled ? t.color.ink.tertiary : t.color.brand[500], fontSize: t.type.labelLg.fontSize, fontWeight: t.type.labelLg.fontWeight }}>
        {label}
      </Text>
    </Pressable>
  );
}

function AddressBlock({
  order,
  address,
  resolving,
}: {
  order: Order;
  address: Address | null;
  resolving: boolean;
}) {
  const t = useTheme();
  // Nothing real to show: order has no saved address, or it couldn't be
  // resolved. Hide the block rather than render a fabricated city.
  if (!order.addressId || (!address && !resolving)) return null;
  return (
    <View
      style={{
        backgroundColor: t.color.bg.surface,
        borderColor: t.color.line.hairline,
        borderRadius: t.radius.lg,
        borderWidth: 1,
        padding: t.space[4],
        flexDirection: 'row',
        gap: t.space[3],
        alignItems: 'flex-start',
      }}
    >
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: t.radius.sm,
          backgroundColor: t.color.brand[100],
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <MapPin color={t.color.brand[500]} size={18} strokeWidth={2} />
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={{ color: t.color.ink.secondary, fontSize: t.type.labelSm.fontSize, fontWeight: t.type.labelSm.fontWeight }}>
          АДРЕС УБОРКИ
        </Text>
        {address ? (
          <Text style={{ color: t.color.ink.primary, fontSize: t.type.bodyLg.fontSize, fontWeight: '600' }}>
            {formatAddress(address)}
          </Text>
        ) : (
          <View
            style={{
              height: t.type.bodyLg.fontSize,
              width: '70%',
              marginTop: 4,
              borderRadius: t.radius.sm,
              backgroundColor: t.color.bg.sunken,
            }}
          />
        )}
      </View>
    </View>
  );
}

function SummaryBlock({ order }: { order: Order }) {
  const t = useTheme();
  return (
    <View
      style={{
        backgroundColor: t.color.bg.surface,
        borderColor: t.color.line.hairline,
        borderRadius: t.radius.lg,
        borderWidth: 1,
        padding: t.space[4],
        gap: t.space[3],
      }}
    >
      <Text style={{ color: t.color.ink.primary, fontSize: t.type.titleSm.fontSize, fontWeight: t.type.titleSm.fontWeight }}>
        Детали услуги
      </Text>
      <View style={{ gap: t.space[2] }}>
        {order.notes && (
          <Row label="Комментарий" value={order.notes} />
        )}
        {order.scheduledAt && (
          <Row
            label="Время визита"
            value={new Date(order.scheduledAt).toLocaleString(localeTag('ru'), {
              day: 'numeric',
              month: 'long',
              hour: '2-digit',
              minute: '2-digit',
            })}
          />
        )}
        <Row label="Источник" value={order.source ?? '—'} />
      </View>
      <View style={{ height: 1, backgroundColor: t.color.line.hairline }} />
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={{ color: t.color.ink.primary, fontSize: t.type.titleSm.fontSize, fontWeight: t.type.titleSm.fontWeight }}>
          К оплате
        </Text>
        <Text
          style={{
            color: t.color.brand[500],
            fontSize: t.type.titleLg.fontSize,
            fontWeight: t.type.titleLg.fontWeight,
            fontVariant: ['tabular-nums'],
          }}
        >
          {formatMoney(order.total, order.currency)}
        </Text>
      </View>
    </View>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  const t = useTheme();
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: t.space[3] }}>
      <Text style={{ color: t.color.ink.secondary, fontSize: t.type.bodyMd.fontSize }}>{label}</Text>
      <Text style={{ color: t.color.ink.primary, fontSize: t.type.bodyMd.fontSize, flex: 1, textAlign: 'right' }}>{value}</Text>
    </View>
  );
}
