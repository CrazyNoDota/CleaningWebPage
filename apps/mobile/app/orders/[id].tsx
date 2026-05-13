import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { io, type Socket } from 'socket.io-client';
import { Button, Card, ErrorText, Muted, Screen, Title } from '@/components/ui';
import {
  ApiError,
  WS_BASE,
  confirmStubPayment,
  getOrder,
  getOrderCleaner,
  initiatePayment,
} from '@/lib/api';
import { formatMoney, localeTag, statusLabel } from '@/lib/format';
import { useSession } from '@/lib/session';
import { colors } from '@/lib/theme';
import type { CleanerCard, Order, OrderStatus } from '@/lib/types';

const STATUS_ORDER: OrderStatus[] = [
  'created',
  'paid',
  'assigned',
  'en_route',
  'in_progress',
  'done',
  'reviewed',
];

export default function OrderDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { session } = useSession();
  const [order, setOrder] = useState<Order | null>(null);
  const [cleaner, setCleaner] = useState<CleanerCard | null>(null);
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
  }, [id, session]);

  useEffect(() => {
    if (!session || !id) return;
    const socket: Socket = io(`${WS_BASE}/realtime`, {
      auth: { token: session.accessToken },
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
    return STATUS_ORDER.indexOf(order.status);
  }, [order]);

  async function pay() {
    if (!order) return;
    setPaying(true);
    setError(null);
    try {
      const payment = await initiatePayment(order.id, `mobile-${order.id}`);
      if (payment.nextAction === 'stub_confirm') {
        await confirmStubPayment(payment.id);
        setOrder(await getOrder(order.id));
      }
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Не удалось оплатить');
    } finally {
      setPaying(false);
    }
  }

  return (
    <Screen padded={false}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Title>Заказ</Title>
          {live && <Text style={styles.live}>● Live</Text>}
        </View>
        <ErrorText>{error}</ErrorText>
        {!order && !error && <ActivityIndicator color={colors.brand} />}
        {order && (
          <>
            <Card>
              <View style={styles.row}>
                <Text style={styles.label}>Статус</Text>
                <Text style={styles.value}>{statusLabel(order.status)}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Сумма</Text>
                <Text style={styles.value}>{formatMoney(order.total, order.currency)}</Text>
              </View>
              {order.scheduledAt && (
                <View style={styles.row}>
                  <Text style={styles.label}>Время</Text>
                  <Text style={styles.value}>
                    {new Date(order.scheduledAt).toLocaleString(localeTag('ru'))}
                  </Text>
                </View>
              )}
              <View style={styles.timeline}>
                {STATUS_ORDER.map((status, index) => (
                  <View
                    key={status}
                    style={[
                      styles.timelineSegment,
                      index <= stepIndex && styles.timelineSegmentActive,
                    ]}
                  />
                ))}
              </View>
              {order.status === 'created' && (
                <View style={styles.payAction}>
                  <Button onPress={pay} disabled={paying}>
                    {paying ? 'Оплачиваем...' : 'Оплатить'}
                  </Button>
                </View>
              )}
            </Card>

            <Card>
              <Text style={styles.cardTitle}>Клинер</Text>
              {cleaner ? (
                <View style={styles.cleaner}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{cleaner.displayName.charAt(0)}</Text>
                  </View>
                  <View style={styles.cleanerText}>
                    <Text style={styles.cleanerName}>{cleaner.displayName}</Text>
                    <Muted>
                      ★ {cleaner.ratingAvg.toFixed(1)} · опыт {cleaner.yearsOfExperience} лет
                    </Muted>
                  </View>
                </View>
              ) : (
                <Muted>Клинер еще не назначен.</Muted>
              )}
            </Card>
          </>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 14,
    padding: 16,
    paddingBottom: 32,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  live: {
    backgroundColor: '#ecfdf5',
    borderRadius: 999,
    color: '#047857',
    fontSize: 12,
    fontWeight: '800',
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 8,
  },
  label: {
    color: colors.muted,
  },
  value: {
    color: colors.ink,
    flex: 1,
    fontWeight: '800',
    textAlign: 'right',
  },
  timeline: {
    flexDirection: 'row',
    gap: 4,
    marginTop: 14,
  },
  timelineSegment: {
    backgroundColor: colors.faint,
    borderRadius: 999,
    flex: 1,
    height: 7,
  },
  timelineSegmentActive: {
    backgroundColor: colors.brand,
  },
  payAction: {
    marginTop: 16,
  },
  cardTitle: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 10,
  },
  cleaner: {
    flexDirection: 'row',
    gap: 12,
  },
  avatar: {
    alignItems: 'center',
    backgroundColor: colors.brandSoft,
    borderRadius: 28,
    height: 56,
    justifyContent: 'center',
    width: 56,
  },
  avatarText: {
    color: colors.brand,
    fontSize: 24,
    fontWeight: '900',
  },
  cleanerText: {
    flex: 1,
    gap: 4,
  },
  cleanerName: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: '800',
  },
});
