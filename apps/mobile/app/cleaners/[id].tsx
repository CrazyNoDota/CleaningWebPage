import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ShieldCheck, Star } from 'lucide-react-native';
import { BottomActionBar, Button, ErrorText, Muted, Screen, Title } from '@/components/ui';
import { ApiError, getCleaner, listCleanerReviews } from '@/lib/api';
import { localeTag } from '@/lib/format';
import { useTheme } from '@/lib/theme-provider';
import type { CleanerCard, CleanerReview } from '@/lib/types';

const SPECIALIZATION_RU: Record<string, string> = {
  apartment: 'Квартиры',
  deep: 'Генеральная уборка',
  house: 'Дома',
  office: 'Офисы',
  post_renovation: 'После ремонта',
};

export default function CleanerProfileScreen() {
  const t = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [cleaner, setCleaner] = useState<CleanerCard | null>(null);
  const [reviews, setReviews] = useState<CleanerReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setLoading(true);
    Promise.all([
      getCleaner(id, 'ru').catch((e: ApiError) => {
        if (!cancelled) setError(e.message);
        return null;
      }),
      listCleanerReviews(id, 20).catch(() => [] as CleanerReview[]),
    ]).then(([c, r]) => {
      if (cancelled) return;
      setCleaner(c);
      setReviews(r);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [id]);

  return (
    <Screen padded={false}>
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        {loading && (
          <View style={{ padding: t.space[6], alignItems: 'center' }}>
            <ActivityIndicator color={t.color.brand[500]} />
          </View>
        )}

        {!loading && error && !cleaner && (
          <View style={{ padding: t.space[4] }}>
            <ErrorText>{error}</ErrorText>
          </View>
        )}

        {cleaner && (
          <>
            <View
              style={{
                marginHorizontal: t.space[4],
                marginTop: t.space[3],
                borderRadius: t.radius.lg,
                backgroundColor: t.color.bg.surface,
                borderColor: t.color.line.hairline,
                borderWidth: 1,
                overflow: 'hidden',
              }}
            >
              <View style={{ width: '100%', aspectRatio: 4 / 5, backgroundColor: t.color.brand[100] }}>
                {cleaner.photoUrl ? (
                  <Image
                    source={{ uri: cleaner.photoUrl }}
                    resizeMode="cover"
                    style={{ width: '100%', height: '100%' }}
                  />
                ) : (
                  <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ fontSize: 64, fontWeight: '700', color: t.color.brand[500] }}>
                      {cleaner.displayName.charAt(0)}
                    </Text>
                  </View>
                )}
              </View>

              <View style={{ padding: t.space[4], gap: t.space[3] }}>
                <View style={{ gap: t.space[2] }}>
                  <Title>{cleaner.displayName}</Title>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.space[2], flexWrap: 'wrap' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <Star color={t.color.accent[500]} size={16} fill={t.color.accent[500]} />
                      <Text style={{ color: t.color.ink.primary, fontSize: t.type.labelLg.fontSize, fontWeight: '600' }}>
                        {cleaner.ratingAvg.toFixed(1)}
                      </Text>
                    </View>
                    <Muted>· {cleaner.ratingCount} отзывов</Muted>
                    {cleaner.verified && (
                      <View
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 4,
                          backgroundColor: t.color.brand[100],
                          paddingHorizontal: t.space[3],
                          paddingVertical: 4,
                          borderRadius: t.radius.pill,
                        }}
                      >
                        <ShieldCheck color={t.color.brand[500]} size={14} strokeWidth={2} />
                        <Text style={{ color: t.color.brand[500], fontSize: t.type.labelSm.fontSize, fontWeight: '600' }}>
                          Проверен
                        </Text>
                      </View>
                    )}
                  </View>
                </View>

                <View style={{ flexDirection: 'row', gap: t.space[2] }}>
                  <Stat value={String(cleaner.yearsOfExperience)} label="Лет опыта" />
                  <Stat value={String(cleaner.completedOrdersCount)} label="Заказов" />
                  <Stat value={cleaner.languages.join(', ').toUpperCase() || '—'} label="Языки" />
                </View>

                {cleaner.bio ? (
                  <View style={{ gap: t.space[2] }}>
                    <SectionHeading>О клинере</SectionHeading>
                    <Text style={{ color: t.color.ink.primary, fontSize: t.type.bodyMd.fontSize, lineHeight: 22 }}>
                      {cleaner.bio}
                    </Text>
                  </View>
                ) : null}

                {cleaner.specialization.length > 0 && (
                  <View style={{ gap: t.space[2] }}>
                    <SectionHeading>Специализация</SectionHeading>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: t.space[2] }}>
                      {cleaner.specialization.map((s) => (
                        <View
                          key={s}
                          style={{
                            backgroundColor: t.color.brand[100],
                            paddingHorizontal: t.space[3],
                            paddingVertical: 6,
                            borderRadius: t.radius.pill,
                          }}
                        >
                          <Text style={{ color: t.color.brand[600], fontSize: t.type.labelSm.fontSize, fontWeight: '600' }}>
                            {SPECIALIZATION_RU[s] ?? s}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}
              </View>
            </View>

            <View style={{ paddingHorizontal: t.space[4], marginTop: t.space[5], gap: t.space[3] }}>
              <Text style={{ color: t.color.ink.primary, fontSize: t.type.titleSm.fontSize, fontWeight: t.type.titleSm.fontWeight }}>
                Отзывы
              </Text>
              {reviews.length === 0 ? (
                <View
                  style={{
                    backgroundColor: t.color.bg.surface,
                    borderColor: t.color.line.hairline,
                    borderWidth: 1,
                    borderRadius: t.radius.lg,
                    padding: t.space[4],
                  }}
                >
                  <Muted>Пока нет отзывов.</Muted>
                </View>
              ) : (
                <View style={{ gap: t.space[2] }}>
                  {reviews.map((r) => (
                    <ReviewCard key={r.id} review={r} />
                  ))}
                </View>
              )}
            </View>
          </>
        )}
      </ScrollView>

      {cleaner && (
        <BottomActionBar>
          <Button onPress={() => router.push('/(tabs)/book')}>Забронировать</Button>
        </BottomActionBar>
      )}
    </Screen>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  const t = useTheme();
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: t.color.bg.sunken,
        borderRadius: t.radius.md,
        padding: t.space[3],
        alignItems: 'center',
        gap: 2,
      }}
    >
      <Text style={{ color: t.color.brand[600], fontSize: t.type.titleSm.fontSize, fontWeight: '800' }}>
        {value}
      </Text>
      <Text style={{ color: t.color.ink.secondary, fontSize: t.type.labelSm.fontSize, textAlign: 'center' }}>
        {label}
      </Text>
    </View>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  const t = useTheme();
  return (
    <Text style={{ color: t.color.ink.primary, fontSize: t.type.titleSm.fontSize, fontWeight: t.type.titleSm.fontWeight }}>
      {children}
    </Text>
  );
}

function ReviewCard({ review }: { review: CleanerReview }) {
  const t = useTheme();
  const stars = '★'.repeat(review.rating) + '☆'.repeat(Math.max(0, 5 - review.rating));
  const dateStr = new Date(review.publishedAt ?? review.createdAt).toLocaleDateString(
    localeTag('ru'),
    { day: '2-digit', month: 'long', year: 'numeric' },
  );
  return (
    <View
      style={{
        backgroundColor: t.color.bg.surface,
        borderColor: t.color.line.hairline,
        borderWidth: 1,
        borderRadius: t.radius.lg,
        padding: t.space[4],
        gap: t.space[2],
      }}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={{ color: t.color.accent[500], fontSize: 14, letterSpacing: 1 }}>{stars}</Text>
        <Text style={{ color: t.color.ink.tertiary, fontSize: t.type.labelSm.fontSize }}>{dateStr}</Text>
      </View>
      {review.comment ? (
        <Text style={{ color: t.color.ink.primary, fontSize: t.type.bodyMd.fontSize, lineHeight: 22 }}>
          {review.comment}
        </Text>
      ) : null}
    </View>
  );
}
