import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import {
  ArrowRight,
  CalendarDays,
  Check,
  Home,
  Info,
  ShieldCheck,
  Sparkles,
  Star,
} from 'lucide-react-native';
import { Button, ErrorText, Muted, Screen } from '@/components/ui';
import { ApiError, getOrder, getOrderCleaner } from '@/lib/api';
import { formatMoney, localeTag, statusLabel } from '@/lib/format';
import { useTheme } from '@/lib/theme-provider';
import type { CleanerCard, Order } from '@/lib/types';

export default function BookingConfirmationScreen() {
  const t = useTheme();
  const { orderId } = useLocalSearchParams<{ orderId?: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [cleaner, setCleaner] = useState<CleanerCard | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!orderId) return;
    getOrder(orderId)
      .then(setOrder)
      .catch((e: ApiError) => setError(e.message));
    getOrderCleaner(orderId, 'ru')
      .then((res) => setCleaner(res.cleaner))
      .catch(() => undefined);
  }, [orderId]);

  return (
    <Screen padded={false}>
      <ScrollView contentContainerStyle={{ padding: t.space[4], paddingBottom: t.space[8], gap: t.space[5] }}>
        <Hero />

        <ErrorText>{error}</ErrorText>

        {!order && !error && <ActivityIndicator color={t.color.brand[500]} />}

        {order && (
          <>
            <OrderIdBlock order={order} />
            <DetailsGrid order={order} />
            {cleaner && <CleanerStrip cleaner={cleaner} />}
            <InfoBanner />
            <Actions
              onView={() => router.replace(`/orders/${order.id}`)}
              onBookAgain={() => router.replace('/(tabs)/book')}
            />
          </>
        )}
      </ScrollView>
    </Screen>
  );
}

function Hero() {
  const t = useTheme();
  return (
    <View style={{ alignItems: 'center', gap: t.space[3], paddingTop: t.space[6] }}>
      <View
        style={{
          width: 88,
          height: 88,
          borderRadius: 44,
          backgroundColor: t.color.brand[500],
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Check color={t.color.ink.onBrand} size={48} strokeWidth={3} />
      </View>
      <Text
        style={{
          color: t.color.ink.primary,
          fontSize: t.type.titleLg.fontSize,
          lineHeight: t.type.titleLg.lineHeight,
          fontWeight: t.type.titleLg.fontWeight,
          textAlign: 'center',
        }}
      >
        Ваш заказ принят!
      </Text>
      <Muted>
        <Text style={{ textAlign: 'center' }}>Мы уже готовимся сделать ваш дом безупречно чистым.</Text>
      </Muted>
    </View>
  );
}

function OrderIdBlock({ order }: { order: Order }) {
  const t = useTheme();
  return (
    <View
      style={{
        backgroundColor: t.color.bg.surface,
        borderColor: t.color.line.hairline,
        borderRadius: t.radius.lg,
        borderWidth: 1,
        padding: t.space[4],
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <View style={{ gap: 2 }}>
        <Text style={{ color: t.color.ink.secondary, fontSize: t.type.labelSm.fontSize, fontWeight: t.type.labelSm.fontWeight }}>
          ID ЗАКАЗА
        </Text>
        <Text
          style={{
            color: t.color.ink.primary,
            fontSize: t.type.titleSm.fontSize,
            fontWeight: t.type.titleSm.fontWeight,
            fontVariant: ['tabular-nums'],
          }}
        >
          #{order.id.slice(0, 6).toUpperCase()}
        </Text>
      </View>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          backgroundColor: t.color.brand[100],
          paddingHorizontal: t.space[3],
          paddingVertical: 6,
          borderRadius: t.radius.pill,
        }}
      >
        <Check color={t.color.brand[500]} size={14} strokeWidth={3} />
        <Text style={{ color: t.color.brand[500], fontSize: t.type.labelSm.fontSize, fontWeight: t.type.labelSm.fontWeight }}>
          {statusLabel(order.status)}
        </Text>
      </View>
    </View>
  );
}

function DetailsGrid({ order }: { order: Order }) {
  const t = useTheme();
  const when = order.scheduledAt
    ? new Date(order.scheduledAt).toLocaleString(localeTag('ru'), {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'Время уточняется';
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
      <DetailRow
        icon={<CalendarDays color={t.color.brand[500]} size={20} strokeWidth={2} />}
        label="ДАТА И ВРЕМЯ ВИЗИТА"
        value={when}
      />
      <View style={{ height: 1, backgroundColor: t.color.line.hairline }} />
      <DetailRow
        icon={<Sparkles color={t.color.brand[500]} size={20} strokeWidth={2} />}
        label="УСЛУГА"
        value="Уборка"
      />
      <View style={{ height: 1, backgroundColor: t.color.line.hairline }} />
      <DetailRow
        icon={<Home color={t.color.brand[500]} size={20} strokeWidth={2} />}
        label="К ОПЛАТЕ"
        value={formatMoney(order.total, order.currency)}
      />
    </View>
  );
}

function DetailRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  const t = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.space[3] }}>
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: t.radius.md,
          backgroundColor: t.color.brand[100],
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {icon}
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={{ color: t.color.ink.secondary, fontSize: t.type.labelSm.fontSize, fontWeight: t.type.labelSm.fontWeight }}>
          {label}
        </Text>
        <Text style={{ color: t.color.ink.primary, fontSize: t.type.bodyLg.fontSize, fontWeight: '600' }}>{value}</Text>
      </View>
    </View>
  );
}

function CleanerStrip({ cleaner }: { cleaner: CleanerCard }) {
  const t = useTheme();
  return (
    <View
      style={{
        backgroundColor: t.color.brand[100],
        borderRadius: t.radius.lg,
        padding: t.space[4],
        flexDirection: 'row',
        alignItems: 'center',
        gap: t.space[3],
      }}
    >
      <View
        style={{
          width: 48,
          height: 48,
          borderRadius: 24,
          backgroundColor: t.color.bg.surface,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text style={{ color: t.color.brand[500], fontSize: 20, fontWeight: '700' }}>
          {cleaner.displayName.charAt(0)}
        </Text>
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Text
            style={{
              color: t.color.ink.primary,
              fontSize: t.type.labelLg.fontSize,
              fontWeight: t.type.titleSm.fontWeight,
            }}
          >
            Ваш клинер: {cleaner.displayName}
          </Text>
          {cleaner.verified && <ShieldCheck color={t.color.brand[500]} size={14} strokeWidth={2} />}
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Star color={t.color.accent[500]} size={12} fill={t.color.accent[500]} />
          <Text style={{ color: t.color.ink.secondary, fontSize: t.type.bodySm.fontSize }}>
            {cleaner.ratingAvg.toFixed(2)} • опыт {cleaner.yearsOfExperience} лет
          </Text>
        </View>
      </View>
    </View>
  );
}

function InfoBanner() {
  const t = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        gap: t.space[3],
        padding: t.space[4],
        borderRadius: t.radius.md,
        backgroundColor: t.color.bg.sunken,
      }}
    >
      <Info color={t.color.ink.secondary} size={18} strokeWidth={2} />
      <Text style={{ flex: 1, color: t.color.ink.secondary, fontSize: t.type.bodySm.fontSize, lineHeight: t.type.bodyMd.lineHeight }}>
        Наш специалист прибудет за 10 минут до назначенного времени. Все чистящие средства включены в стоимость.
      </Text>
    </View>
  );
}

function Actions({ onView, onBookAgain }: { onView: () => void; onBookAgain: () => void }) {
  const t = useTheme();
  return (
    <View style={{ gap: t.space[3], marginTop: t.space[2] }}>
      <Button onPress={onView}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.space[2] }}>
          <Text
            style={{
              color: t.color.ink.onBrand,
              fontSize: t.type.labelLg.fontSize,
              fontWeight: t.type.labelLg.fontWeight,
            }}
          >
            Посмотреть заказ
          </Text>
          <ArrowRight color={t.color.ink.onBrand} size={16} strokeWidth={2} />
        </View>
      </Button>
      <Button variant="secondary" onPress={onBookAgain}>
        Забронировать ещё
      </Button>
    </View>
  );
}
