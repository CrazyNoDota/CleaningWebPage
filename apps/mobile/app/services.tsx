import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ImageBackground,
  Pressable,
  ScrollView,
  Text,
  View,
  type ImageSourcePropType,
} from 'react-native';
import { router } from 'expo-router';
import { Button, Muted, Screen, Title } from '@/components/ui';
import { ApiError, listServices } from '@/lib/api';
import { formatMoney } from '@/lib/format';
import { useTheme } from '@/lib/theme-provider';
import type { Service } from '@/lib/types';

// Local fallback images mapped by slug (used when photoUrl is null)
const SLUG_IMAGES: Record<string, ImageSourcePropType> = {
  'apartment-standard': require('../assets/img/cat_standard.png'),
  'apartment-deep': require('../assets/img/cat_deep.png'),
  'post-renovation': require('../assets/img/cat_post_renovation.png'),
  office: require('../assets/img/cat_office.png'),
};
const FALLBACK_IMAGE = require('../assets/img/pro_supplies.png');

type Audience = 'home' | 'business';

function audienceOf(service: Service): Audience {
  return service.type === 'office' ? 'business' : 'home';
}

export default function ServicesScreen() {
  const t = useTheme();
  const [services, setServices] = useState<Service[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [audience, setAudience] = useState<Audience>('home');

  useEffect(() => {
    listServices('ru')
      .then(setServices)
      .catch((e: ApiError) => setError(e.message));
  }, []);

  const filtered = services?.filter((s) => audienceOf(s) === audience) ?? [];

  return (
    <Screen padded={false}>
      <ScrollView contentContainerStyle={{ padding: t.space[4], paddingBottom: t.space[8], gap: t.space[4] }}>
        <View style={{ gap: t.space[2] }}>
          <Title>Услуги</Title>
          <Muted>Полный список услуг и цены</Muted>
        </View>

        {/* Audience toggle */}
        <View style={{ flexDirection: 'row', gap: t.space[2] }}>
          <Pill label="Для дома" active={audience === 'home'} onPress={() => setAudience('home')} />
          <Pill label="Для бизнеса" active={audience === 'business'} onPress={() => setAudience('business')} />
        </View>

        {error && (
          <Text style={{ color: '#ef4444', fontSize: t.type.bodySm.fontSize }}>{error}</Text>
        )}

        {!services && !error && (
          <ActivityIndicator color={t.color.brand[500]} style={{ marginTop: t.space[6] }} />
        )}

        {/* Service cards */}
        {filtered.map((service) => {
          const imgSource: ImageSourcePropType = service.photoUrl
            ? { uri: service.photoUrl }
            : (SLUG_IMAGES[service.slug] ?? FALLBACK_IMAGE);

          return (
            <View
              key={service.id}
              style={{
                backgroundColor: t.color.bg.surface,
                borderColor: t.color.line.hairline,
                borderWidth: 1,
                borderRadius: t.radius.lg,
                overflow: 'hidden',
              }}
            >
              {/* Cover photo */}
              <ImageBackground
                source={imgSource}
                resizeMode="cover"
                style={{ height: 150 }}
                imageStyle={{ opacity: 0.9 }}
              >
                <View
                  style={{
                    flex: 1,
                    backgroundColor: 'rgba(0,20,30,0.38)',
                    padding: t.space[4],
                    justifyContent: 'flex-end',
                  }}
                >
                  <Text style={{ color: '#fff', fontSize: t.type.titleSm.fontSize, fontWeight: '800' }}>
                    {service.name}
                  </Text>
                </View>
              </ImageBackground>

              {/* Body */}
              <View style={{ padding: t.space[4], gap: t.space[3] }}>
                <Text style={{ color: t.color.brand[600], fontSize: t.type.titleMd.fontSize, fontWeight: '800' }}>
                  от {formatMoney(service.basePrice, service.currency)}
                  <Text style={{ color: t.color.ink.tertiary, fontSize: t.type.bodySm.fontSize, fontWeight: '400' }}>
                    {' '}/ уборка
                  </Text>
                </Text>

                {service.description.length > 0 && (
                  <Text style={{ color: t.color.ink.secondary, fontSize: t.type.bodySm.fontSize, lineHeight: 20 }}>
                    {service.description}
                  </Text>
                )}

                {/* Options */}
                {service.options.length > 0 && (
                  <View style={{ gap: t.space[1] }}>
                    {service.options.slice(0, 3).map((opt) => (
                      <View key={opt.key} style={{ flexDirection: 'row', gap: t.space[2], alignItems: 'flex-start' }}>
                        <Text style={{ color: t.color.brand[500], fontWeight: '700' }}>✓</Text>
                        <Text style={{ color: t.color.ink.primary, fontSize: t.type.bodyMd.fontSize, flex: 1, lineHeight: 22 }}>
                          {opt.label}
                        </Text>
                      </View>
                    ))}
                    {service.options.length > 3 && (
                      <Text style={{ color: t.color.ink.tertiary, fontSize: t.type.bodySm.fontSize }}>
                        + ещё {service.options.length - 3} опции
                      </Text>
                    )}
                  </View>
                )}

                <Button onPress={() => router.push({ pathname: '/(tabs)/book', params: { slug: service.slug } })}>
                  Заказать
                </Button>
              </View>
            </View>
          );
        })}

        {services && filtered.length === 0 && (
          <Muted style={{ textAlign: 'center', marginTop: t.space[8] }}>
            Услуги не найдены
          </Muted>
        )}
      </ScrollView>
    </Screen>
  );
}

function Pill({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  const t = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        paddingHorizontal: t.space[4],
        paddingVertical: t.space[2],
        borderRadius: t.radius.pill,
        borderWidth: active ? 1.5 : 1,
        borderColor: active ? t.color.brand[500] : t.color.line.hairline,
        backgroundColor: active ? t.color.brand[100] : t.color.bg.surface,
        transform: [{ scale: pressed ? 0.97 : 1 }],
      })}
    >
      <Text style={{ color: active ? t.color.brand[600] : t.color.ink.primary, fontWeight: '700' }}>{label}</Text>
    </Pressable>
  );
}
