import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { ChevronRight, Inbox } from 'lucide-react-native';
import { Button, Card, ErrorText, Muted, Screen, StatusChip, Title } from '@/components/ui';
import { ApiError, listOrders } from '@/lib/api';
import { formatMoney, localeTag, statusLabel } from '@/lib/format';
import { useSession } from '@/lib/session';
import { useTheme } from '@/lib/theme-provider';
import type { Order, OrderStatus } from '@/lib/types';

type Tab = 'upcoming' | 'past';

const PAST_STATUSES: OrderStatus[] = ['done', 'reviewed', 'cancelled'];

export default function OrdersScreen() {
  const t = useTheme();
  const { hydrated, session } = useSession();
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>('upcoming');

  const load = useCallback(async () => {
    if (!session) return;
    setError(null);
    try {
      setOrders(await listOrders());
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Не удалось загрузить заказы');
    }
  }, [session]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  async function refresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  const { upcoming, past } = useMemo(() => {
    const list = orders ?? [];
    return {
      upcoming: list.filter((o) => !PAST_STATUSES.includes(o.status)),
      past: list.filter((o) => PAST_STATUSES.includes(o.status)),
    };
  }, [orders]);

  const visible = tab === 'upcoming' ? upcoming : past;

  if (!hydrated) {
    return (
      <Screen>
        <ActivityIndicator color={t.color.brand[500]} />
      </Screen>
    );
  }

  if (!session) {
    return (
      <Screen>
        <Card>
          <Title>Заказы</Title>
          <View style={{ gap: t.space[3], marginTop: t.space[2] }}>
            <Muted>Войдите, чтобы видеть историю и отслеживать статусы.</Muted>
            <Button onPress={() => router.push({ pathname: '/login', params: { next: '/orders' } })}>Войти</Button>
          </View>
        </Card>
      </Screen>
    );
  }

  return (
    <Screen padded={false}>
      <ScrollView
        contentContainerStyle={{ padding: t.space[4], paddingBottom: t.space[8], gap: t.space[4] }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={t.color.brand[500]} />}
      >
        <View style={{ gap: t.space[1] }}>
          <Title>Заказы</Title>
          <Muted>Управляйте уборками в Астане</Muted>
        </View>

        <Segmented tab={tab} onChange={setTab} upcomingCount={upcoming.length} pastCount={past.length} />

        <ErrorText>{error}</ErrorText>

        {orders === null && !error && <ActivityIndicator color={t.color.brand[500]} />}

        {orders !== null && visible.length === 0 && (
          <EmptyState
            kind={tab}
            onCreate={() => router.push('/(tabs)/book')}
          />
        )}

        {visible.map((order) => (
          <OrderCard key={order.id} order={order} variant={tab} onPress={() => router.push(`/orders/${order.id}`)} />
        ))}
      </ScrollView>
    </Screen>
  );
}

function Segmented({
  tab,
  onChange,
  upcomingCount,
  pastCount,
}: {
  tab: Tab;
  onChange: (t: Tab) => void;
  upcomingCount: number;
  pastCount: number;
}) {
  const t = useTheme();
  const buttons: { value: Tab; label: string; count: number }[] = [
    { value: 'upcoming', label: 'Предстоящие', count: upcomingCount },
    { value: 'past', label: 'Прошлые', count: pastCount },
  ];
  return (
    <View
      style={{
        flexDirection: 'row',
        padding: t.space[1],
        backgroundColor: t.color.bg.sunken,
        borderRadius: t.radius.pill,
      }}
    >
      {buttons.map((b) => {
        const active = tab === b.value;
        return (
          <Pressable
            key={b.value}
            onPress={() => onChange(b.value)}
            style={{
              flex: 1,
              flexDirection: 'row',
              justifyContent: 'center',
              alignItems: 'center',
              gap: t.space[2],
              paddingVertical: t.space[2],
              borderRadius: t.radius.pill,
              backgroundColor: active ? t.color.bg.surface : 'transparent',
            }}
          >
            <Text
              style={{
                color: active ? t.color.ink.primary : t.color.ink.secondary,
                fontSize: t.type.labelLg.fontSize,
                fontWeight: t.type.labelLg.fontWeight,
              }}
            >
              {b.label}
            </Text>
            {b.count > 0 && (
              <View
                style={{
                  backgroundColor: active ? t.color.brand[500] : t.color.line.hairline,
                  borderRadius: t.radius.pill,
                  minWidth: 22,
                  paddingHorizontal: 6,
                  paddingVertical: 2,
                  alignItems: 'center',
                }}
              >
                <Text
                  style={{
                    color: active ? t.color.ink.onBrand : t.color.ink.secondary,
                    fontSize: 11,
                    fontWeight: '700',
                  }}
                >
                  {b.count}
                </Text>
              </View>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

function OrderCard({ order, variant, onPress }: { order: Order; variant: Tab; onPress: () => void }) {
  const t = useTheme();
  const tone: 'brand' | 'warn' = order.status === 'created' ? 'warn' : 'brand';

  if (variant === 'past') {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          {
            flexDirection: 'row',
            alignItems: 'center',
            gap: t.space[3],
            backgroundColor: t.color.bg.surface,
            borderColor: t.color.line.hairline,
            borderRadius: t.radius.md,
            borderWidth: 1,
            paddingHorizontal: t.space[4],
            paddingVertical: t.space[3],
            opacity: pressed ? 0.7 : 1,
          },
        ]}
      >
        <View style={{ flex: 1, gap: 2 }}>
          <Text
            style={{
              color: t.color.ink.primary,
              fontSize: t.type.labelLg.fontSize,
              fontWeight: t.type.labelLg.fontWeight,
            }}
          >
            {statusLabel(order.status)}
          </Text>
          <Text style={{ color: t.color.ink.secondary, fontSize: t.type.bodySm.fontSize }}>
            {formatDateMd(order.scheduledAt ?? order.createdAt)} • {formatMoney(order.total, order.currency)}
          </Text>
        </View>
        <ChevronRight color={t.color.ink.tertiary} size={18} strokeWidth={2} />
      </Pressable>
    );
  }

  return (
    <Pressable onPress={onPress}>
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
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <View style={{ gap: t.space[2], flex: 1 }}>
            <StatusChip label={statusLabel(order.status)} tone={tone} />
            <Text
              style={{
                color: t.color.ink.primary,
                fontSize: t.type.titleSm.fontSize,
                lineHeight: t.type.titleSm.lineHeight,
                fontWeight: t.type.titleSm.fontWeight,
              }}
            >
              Заказ #{order.id.slice(0, 6).toUpperCase()}
            </Text>
            <Text style={{ color: t.color.ink.secondary, fontSize: t.type.bodyMd.fontSize }}>
              {formatScheduledAt(order.scheduledAt)}
            </Text>
          </View>
          <Text
            style={{
              color: t.color.ink.primary,
              fontSize: t.type.titleSm.fontSize,
              fontWeight: t.type.titleLg.fontWeight,
              fontVariant: ['tabular-nums'],
            }}
          >
            {formatMoney(order.total, order.currency)}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

function EmptyState({ kind, onCreate }: { kind: Tab; onCreate: () => void }) {
  const t = useTheme();
  const text = kind === 'upcoming' ? 'Нет предстоящих заказов' : 'История пуста';
  const sub =
    kind === 'upcoming'
      ? 'Закажите уборку — мы найдём свободного клинера.'
      : 'Здесь появятся ваши завершённые заказы.';
  return (
    <View
      style={{
        alignItems: 'center',
        gap: t.space[3],
        backgroundColor: t.color.bg.surface,
        borderColor: t.color.line.hairline,
        borderRadius: t.radius.lg,
        borderWidth: 1,
        paddingHorizontal: t.space[5],
        paddingVertical: t.space[7],
      }}
    >
      <View
        style={{
          width: 56,
          height: 56,
          borderRadius: t.radius.pill,
          backgroundColor: t.color.brand[100],
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Inbox color={t.color.brand[500]} size={28} strokeWidth={2} />
      </View>
      <Text
        style={{
          color: t.color.ink.primary,
          fontSize: t.type.titleSm.fontSize,
          fontWeight: t.type.titleSm.fontWeight,
          textAlign: 'center',
        }}
      >
        {text}
      </Text>
      <Text style={{ color: t.color.ink.secondary, fontSize: t.type.bodyMd.fontSize, textAlign: 'center' }}>{sub}</Text>
      {kind === 'upcoming' && (
        <View style={{ marginTop: t.space[2] }}>
          <Button onPress={onCreate}>Заказать уборку</Button>
        </View>
      )}
    </View>
  );
}

function formatScheduledAt(iso: string | null) {
  if (!iso) return 'Время уточняется';
  const d = new Date(iso);
  const date = d.toLocaleDateString(localeTag('ru'), { day: 'numeric', month: 'long' });
  const time = d.toLocaleTimeString(localeTag('ru'), { hour: '2-digit', minute: '2-digit' });
  return `${date} • ${time}`;
}

function formatDateMd(iso: string) {
  return new Date(iso).toLocaleDateString(localeTag('ru'), { day: 'numeric', month: 'short' });
}
