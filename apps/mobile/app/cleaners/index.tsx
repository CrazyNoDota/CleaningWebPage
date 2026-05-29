import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Image, Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { CheckCircle2, Star } from 'lucide-react-native';
import { ErrorText, Muted, Screen } from '@/components/ui';
import { ApiError, listCleaners } from '@/lib/api';
import { useTheme } from '@/lib/theme-provider';
import type { CleanerCard } from '@/lib/types';

const PAGE_SIZE = 20;

export default function CleanersListScreen() {
  const t = useTheme();
  const [items, setItems] = useState<CleanerCard[]>([]);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadMore() {
    if (loading || done) return;
    setLoading(true);
    try {
      const next = await listCleaners('ru', PAGE_SIZE, items.length);
      setItems((prev) => [...prev, ...next]);
      if (next.length < PAGE_SIZE) setDone(true);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Не удалось загрузить клинеров');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadMore();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Screen padded={false}>
      <FlatList
        contentContainerStyle={{ padding: t.space[4], paddingBottom: t.space[8], gap: t.space[3] }}
        data={items}
        keyExtractor={(c) => c.id}
        ListHeaderComponent={
          <View style={{ gap: t.space[1], marginBottom: t.space[3] }}>
            <Text style={{ color: t.color.ink.primary, fontSize: 26, fontWeight: '800' }}>Клинеры</Text>
            <Muted>Команда проверенных специалистов в Астане</Muted>
            {error && <ErrorText>{error}</ErrorText>}
          </View>
        }
        renderItem={({ item }) => <CleanerRow cleaner={item} />}
        ItemSeparatorComponent={() => <View style={{ height: t.space[3] }} />}
        onEndReached={loadMore}
        onEndReachedThreshold={0.4}
        ListFooterComponent={
          loading ? <ActivityIndicator color={t.color.brand[500]} style={{ marginTop: t.space[4] }} /> : null
        }
        ListEmptyComponent={
          !loading && !error ? (
            <View style={{ alignItems: 'center', padding: t.space[6] }}>
              <Muted>Пока никого нет</Muted>
            </View>
          ) : null
        }
      />
    </Screen>
  );
}

function CleanerRow({ cleaner }: { cleaner: CleanerCard }) {
  const t = useTheme();
  return (
    <Pressable
      onPress={() => router.push(`/cleaners/${cleaner.id}`)}
      style={({ pressed }) => ({
        flexDirection: 'row',
        gap: t.space[3],
        backgroundColor: t.color.bg.surface,
        borderColor: t.color.line.hairline,
        borderWidth: 1,
        borderRadius: t.radius.lg,
        padding: t.space[3],
        transform: [{ scale: pressed ? 0.98 : 1 }],
      })}
    >
      <View
        style={{
          width: 84,
          height: 84,
          borderRadius: t.radius.md,
          overflow: 'hidden',
          backgroundColor: t.color.brand[100],
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {cleaner.photoUrl ? (
          <Image source={{ uri: cleaner.photoUrl }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
        ) : (
          <Text style={{ fontSize: 32, fontWeight: '800', color: t.color.brand[500] }}>
            {cleaner.displayName.charAt(0)}
          </Text>
        )}
      </View>
      <View style={{ flex: 1, gap: 4, justifyContent: 'center' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.space[2] }}>
          <Text
            numberOfLines={1}
            style={{ color: t.color.ink.primary, fontSize: t.type.titleSm.fontSize, fontWeight: '800', flexShrink: 1 }}
          >
            {cleaner.displayName}
          </Text>
          {cleaner.verified && <CheckCircle2 color={t.color.brand[500]} size={16} strokeWidth={2.5} />}
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.space[2] }}>
          <Star color={t.color.accent[500]} size={13} fill={t.color.accent[500]} />
          <Text style={{ color: t.color.ink.secondary, fontSize: t.type.bodySm.fontSize, fontWeight: '600' }}>
            {(cleaner.ratingAvg ?? 5).toFixed(1)}
          </Text>
          <Text style={{ color: t.color.ink.tertiary, fontSize: t.type.bodySm.fontSize }}>
            · {cleaner.completedOrdersCount} заказов
          </Text>
        </View>
        <Text numberOfLines={2} style={{ color: t.color.ink.secondary, fontSize: t.type.bodySm.fontSize, lineHeight: 18 }}>
          {cleaner.bio || `${cleaner.yearsOfExperience} лет опыта · ${cleaner.languages.join(', ')}`}
        </Text>
      </View>
    </Pressable>
  );
}
