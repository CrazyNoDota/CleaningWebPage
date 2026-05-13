import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Button, Card, ErrorText, Muted, Screen, Title } from '@/components/ui';
import { ApiError, listOrders } from '@/lib/api';
import { formatMoney, localeTag, statusLabel } from '@/lib/format';
import { useSession } from '@/lib/session';
import { colors } from '@/lib/theme';
import type { Order } from '@/lib/types';

export default function OrdersScreen() {
  const { hydrated, session } = useSession();
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  if (!hydrated) {
    return (
      <Screen>
        <ActivityIndicator color={colors.brand} />
      </Screen>
    );
  }

  if (!session) {
    return (
      <Screen>
        <Card>
          <Title>Заказы</Title>
          <View style={styles.stack}>
            <Muted>Войдите, чтобы видеть историю и отслеживать статусы.</Muted>
            <Button onPress={() => router.push({ pathname: '/login', params: { next: '/orders' } })}>
              Войти
            </Button>
          </View>
        </Card>
      </Screen>
    );
  }

  return (
    <Screen padded={false}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
      >
        <Title>Мои заказы</Title>
        <ErrorText>{error}</ErrorText>
        {orders === null && !error && <ActivityIndicator color={colors.brand} />}
        {orders?.length === 0 && (
          <Card>
            <View style={styles.stack}>
              <Muted>У вас пока нет заказов.</Muted>
              <Button onPress={() => router.push('/')}>Заказать уборку</Button>
            </View>
          </Card>
        )}
        {orders?.map((order) => (
          <Pressable key={order.id} onPress={() => router.push(`/orders/${order.id}`)}>
            <Card>
              <View style={styles.orderHead}>
                <Text style={styles.status}>{statusLabel(order.status)}</Text>
                <Text style={styles.total}>{formatMoney(order.total, order.currency)}</Text>
              </View>
              <Text style={styles.date}>
                {order.scheduledAt
                  ? new Date(order.scheduledAt).toLocaleString(localeTag('ru'))
                  : new Date(order.createdAt).toLocaleDateString(localeTag('ru'))}
              </Text>
              <Text style={styles.id}>#{order.id.slice(0, 8)}</Text>
            </Card>
          </Pressable>
        ))}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 12,
    padding: 16,
    paddingBottom: 32,
  },
  stack: {
    gap: 14,
  },
  orderHead: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  status: {
    color: colors.brand,
    fontSize: 15,
    fontWeight: '800',
  },
  total: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: '900',
  },
  date: {
    color: colors.ink,
    fontSize: 14,
    marginTop: 8,
  },
  id: {
    color: colors.muted,
    fontSize: 12,
    marginTop: 4,
  },
});
