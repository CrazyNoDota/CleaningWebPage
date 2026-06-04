import { useEffect, useState } from 'react';
import { Image, ImageBackground, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import {
  Briefcase,
  ChevronDown,
  Info,
  MapPin,
  ShieldCheck,
  Sparkles,
  Star,
  Users,
} from 'lucide-react-native';
import { Button, Muted, Screen } from '@/components/ui';
import { listCleaners, listServices } from '@/lib/api';
import { formatMoney } from '@/lib/format';
import { useTheme } from '@/lib/theme-provider';
import type { CleanerCard, Service } from '@/lib/types';

const PROMO_IMG = require('../../assets/img/before_after.png');
const ROOMS = [
  { name: 'Гостиная', img: require('../../assets/img/pro_living.png') },
  { name: 'Спальня', img: require('../../assets/img/pro_bedroom.png') },
  { name: 'Кухня', img: require('../../assets/img/pro_kitchen.png') },
  { name: 'Санузел', img: require('../../assets/img/pro_bathroom.png') },
];

type Property = 'apartment' | 'house';

const PLANS: Record<Property, Array<{ key: string; title: string; rooms: string; bath: string; price: string; badge?: string }>> = {
  apartment: [
    { key: '1k', title: 'Однушка', rooms: '1 комната', bath: '1 санузел', price: 'от 15 000 ₸' },
    { key: '2k', title: 'Двушка', rooms: '2 комнаты', bath: '1 санузел', price: 'от 19 000 ₸', badge: 'TOP' },
    { key: '3k', title: 'Трешка', rooms: '3 комнаты', bath: '1 санузел', price: 'от 23 000 ₸' },
  ],
  house: [
    { key: 's', title: 'Малый', rooms: 'до 100 м²', bath: '1–2 с/у', price: 'от 28 000 ₸' },
    { key: 'm', title: 'Средний', rooms: '100–200 м²', bath: '2 с/у', price: 'от 42 000 ₸', badge: 'TOP' },
    { key: 'l', title: 'Большой', rooms: '200+ м²', bath: '2–3 с/у', price: 'от 65 000 ₸' },
  ],
};

const TIERS = [
  {
    name: 'Поддерживающая',
    price: '12 750 ₸',
    desc: 'Для поддержания дома в чистоте и порядке',
    items: ['Профессиональные средства', 'Собираем мусор', 'Пылесосим и моем полы'],
    featured: false,
  },
  {
    name: 'Генеральная',
    badge: '★ Популярно',
    price: '27 119 ₸',
    desc: 'Комфорт с дополнительными опциями',
    items: ['Моем окна с внутренней стороны', 'Вдвое больше мастеров', 'Кафель на кухне и санузле'],
    featured: true,
  },
  {
    name: 'После ремонта',
    price: '43 500 ₸',
    desc: 'Удаляем послеремонтную пыль со всех поверхностей',
    items: ['Удаляем строительную пыль', 'Удаляем остатки клея', 'Моем кафель на стенах'],
    featured: false,
  },
];

const WHY = [
  { icon: '🛡️', title: 'Безопасность', body: 'Тщательный отбор и проверка всех сотрудников' },
  { icon: '✨', title: 'Качество', body: 'Передовые стандарты и профессиональная техника' },
  { icon: '⚡', title: 'Удобство', body: 'Простая заявка, оперативный выезд' },
  { icon: '💚', title: 'Сервис', body: 'Вежливый сервис и профессионализм' },
];

const STATS = [
  { value: '8 лет', label: 'на рынке' },
  { value: '1 000+', label: 'клинеров' },
  { value: '16 млн ₸', label: 'страховка' },
];

export default function HomeTab() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const [cleaners, setCleaners] = useState<CleanerCard[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [property, setProperty] = useState<Property>('apartment');

  useEffect(() => {
    listCleaners('ru', 8).then(setCleaners).catch(() => undefined);
    listServices('ru').then(setServices).catch(() => undefined);
  }, []);

  return (
    <Screen padded={false}>
      <ScrollView contentContainerStyle={{ paddingBottom: t.space[8] }}>
        {/* TOP BAR — logo + address picker (top.kz style) */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: t.space[4],
            paddingTop: insets.top + t.space[3],
            paddingBottom: t.space[2],
            gap: t.space[3],
          }}
        >
          <Text style={{ color: t.color.brand[600], fontSize: 26, fontWeight: '900', letterSpacing: -0.5 }}>
            shine<Text style={{ color: t.color.ink.primary }}>x</Text>
          </Text>
          <Pressable
            onPress={() => router.push('/contacts')}
            style={({ pressed }) => ({
              flexDirection: 'row',
              alignItems: 'center',
              gap: t.space[2],
              backgroundColor: t.color.bg.surface,
              borderColor: t.color.line.hairline,
              borderWidth: 1,
              borderRadius: t.radius.pill,
              paddingHorizontal: t.space[3],
              paddingVertical: t.space[2],
              transform: [{ scale: pressed ? 0.97 : 1 }],
            })}
          >
            <MapPin color={t.color.brand[500]} size={16} strokeWidth={2.2} />
            <Text style={{ color: t.color.ink.primary, fontSize: t.type.labelLg.fontSize, fontWeight: '600' }}>
              Астана
            </Text>
            <ChevronDown color={t.color.ink.secondary} size={14} strokeWidth={2.2} />
          </Pressable>
        </View>

        {/* PROMO BANNER — before/after */}
        <View style={{ marginHorizontal: t.space[4], marginTop: t.space[2] }}>
          <Pressable onPress={() => router.push('/services')}>
            <ImageBackground
              source={PROMO_IMG}
              resizeMode="cover"
              style={{ height: 120, borderRadius: t.radius.lg, overflow: 'hidden' }}
              imageStyle={{ borderRadius: t.radius.lg }}
            >
              <View
                style={{
                  flex: 1,
                  backgroundColor: 'rgba(7,32,48,0.45)',
                  padding: t.space[4],
                  justifyContent: 'center',
                }}
              >
                <Text style={{ color: '#fff', fontSize: t.type.titleSm.fontSize, fontWeight: '800', maxWidth: '70%' }}>
                  Идеальная чистота — от 12 750 ₸
                </Text>
                <Text style={{ color: '#fff', opacity: 0.92, fontSize: t.type.bodySm.fontSize, marginTop: 2 }}>
                  Закажите уборку за 60 секунд
                </Text>
              </View>
            </ImageBackground>
          </Pressable>
        </View>

        {/* PROPERTY CHIP SWITCH */}
        <View style={{ flexDirection: 'row', gap: t.space[3], paddingHorizontal: t.space[4], marginTop: t.space[4] }}>
          <Chip label="🏢  Квартира" active={property === 'apartment'} onPress={() => setProperty('apartment')} />
          <Chip label="🏠  Частный дом" active={property === 'house'} onPress={() => setProperty('house')} />
        </View>

        {/* ROOM PLAN CARDS */}
        <View style={{ flexDirection: 'row', gap: t.space[3], paddingHorizontal: t.space[4], marginTop: t.space[3] }}>
          {PLANS[property].map((plan) => (
            <Pressable
              key={plan.key}
              onPress={() => router.push('/(tabs)/book')}
              style={({ pressed }) => ({
                flex: 1,
                backgroundColor: plan.badge ? t.color.brand[100] : t.color.bg.surface,
                borderColor: plan.badge ? t.color.brand[500] : t.color.line.hairline,
                borderWidth: plan.badge ? 1.5 : 1,
                borderRadius: t.radius.lg,
                padding: t.space[3],
                gap: 4,
                transform: [{ scale: pressed ? 0.97 : 1 }],
              })}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ color: t.color.ink.primary, fontSize: t.type.labelLg.fontSize, fontWeight: '800' }}>
                  {plan.title}
                </Text>
                {plan.badge && (
                  <View style={{ backgroundColor: '#FF5A4A', borderRadius: t.radius.pill, paddingHorizontal: 6, paddingVertical: 1 }}>
                    <Text style={{ color: '#fff', fontSize: 10, fontWeight: '800' }}>{plan.badge}</Text>
                  </View>
                )}
              </View>
              <Text style={{ color: t.color.ink.secondary, fontSize: t.type.bodySm.fontSize }}>{plan.rooms}</Text>
              <Text style={{ color: t.color.ink.secondary, fontSize: t.type.bodySm.fontSize }}>{plan.bath}</Text>
              <Text style={{ color: t.color.ink.primary, fontSize: t.type.labelLg.fontSize, fontWeight: '800', marginTop: 4 }}>
                {plan.price}
              </Text>
            </Pressable>
          ))}
        </View>
        <Text
          style={{
            color: t.color.ink.tertiary,
            fontSize: t.type.bodySm.fontSize,
            paddingHorizontal: t.space[4],
            marginTop: t.space[2],
          }}
        >
          Параметры можно изменить на следующем шаге
        </Text>

        {/* SERVICES GRID — dynamic from API */}
        {services.length > 0 && (
          <View style={{ paddingHorizontal: t.space[4], marginTop: t.space[5] }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: t.space[3] }}>
              <Text style={{ color: t.color.ink.primary, fontSize: t.type.titleMd.fontSize, fontWeight: '800' }}>
                Услуги
              </Text>
              <Pressable onPress={() => router.push('/services')} hitSlop={10}>
                <Text style={{ color: t.color.brand[600], fontSize: t.type.labelLg.fontSize, fontWeight: '700' }}>
                  Все услуги
                </Text>
              </Pressable>
            </View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: t.space[3] }}>
              {services.map((s, idx) => (
                <Pressable
                  key={s.id}
                  onPress={() => router.push({ pathname: '/(tabs)/book', params: { slug: s.slug } })}
                  style={({ pressed }) => ({
                    width: '47%',
                    flexGrow: 1,
                    minHeight: 100,
                    backgroundColor: idx === 0 ? '#E7F2FF' : t.color.bg.surface,
                    borderColor: t.color.line.hairline,
                    borderWidth: 1,
                    borderRadius: t.radius.lg,
                    padding: t.space[3],
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: t.space[3],
                    transform: [{ scale: pressed ? 0.97 : 1 }],
                  })}
                >
                  <View
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: t.radius.md,
                      backgroundColor: idx === 0 ? 'rgba(11,23,39,0.08)' : t.color.brand[100],
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Sparkles color={idx === 0 ? '#0B1727' : t.color.brand[500]} size={24} strokeWidth={2} />
                  </View>
                  <View style={{ flex: 1, gap: 4 }}>
                    <Text style={{ color: idx === 0 ? '#0B1727' : t.color.ink.primary, fontSize: t.type.labelLg.fontSize, fontWeight: '700' }}>
                      {s.name}
                    </Text>
                  </View>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {/* SUBSCRIPTION BANNER */}
        <View style={{ marginHorizontal: t.space[4], marginTop: t.space[5] }}>
          <Pressable onPress={() => router.push('/(tabs)/book')}>
            <View
              style={{
                backgroundColor: t.color.brand[500],
                borderRadius: t.radius.lg,
                padding: t.space[4],
                flexDirection: 'row',
                alignItems: 'center',
                gap: t.space[3],
              }}
            >
              <Text style={{ fontSize: 28 }}>⚡</Text>
              <View style={{ flex: 1 }}>
                <Text style={{ color: '#fff', fontSize: t.type.titleSm.fontSize, fontWeight: '800' }}>
                  По подписке дешевле!
                </Text>
                <View style={{ alignSelf: 'flex-start', backgroundColor: '#D7FF8A', paddingHorizontal: t.space[2], paddingVertical: 1, borderRadius: t.radius.pill, marginTop: 4 }}>
                  <Text style={{ color: '#2A4A00', fontSize: 11, fontWeight: '800' }}>Скидка до 15%</Text>
                </View>
              </View>
            </View>
          </Pressable>
        </View>

        {/* STATS strip */}
        <View
          style={{
            flexDirection: 'row',
            margin: t.space[4],
            backgroundColor: t.color.bg.surface,
            borderColor: t.color.line.hairline,
            borderWidth: 1,
            borderRadius: t.radius.lg,
            padding: t.space[3],
          }}
        >
          {STATS.map((s, i) => (
            <View
              key={s.label}
              style={{
                flex: 1,
                alignItems: 'center',
                gap: 2,
                borderLeftWidth: i === 0 ? 0 : 1,
                borderLeftColor: t.color.line.hairline,
              }}
            >
              <Text style={{ color: t.color.brand[600], fontSize: t.type.titleSm.fontSize, fontWeight: '800' }}>
                {s.value}
              </Text>
              <Text style={{ color: t.color.ink.secondary, fontSize: t.type.labelSm.fontSize, textAlign: 'center' }}>
                {s.label}
              </Text>
            </View>
          ))}
        </View>

        {/* ROOMS gallery */}
        <Section title="Что входит в уборку">
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: t.space[3] }}>
            {ROOMS.map((room) => (
              <View
                key={room.name}
                style={{
                  width: '47%',
                  height: 120,
                  borderRadius: t.radius.md,
                  overflow: 'hidden',
                  backgroundColor: t.color.brand[100],
                }}
              >
                <ImageBackground source={room.img} resizeMode="cover" style={{ flex: 1, justifyContent: 'flex-end' }}>
                  <View style={{ backgroundColor: 'rgba(0,0,0,0.45)', padding: t.space[3] }}>
                    <Text style={{ color: '#fff', fontSize: t.type.labelLg.fontSize, fontWeight: '700' }}>
                      {room.name}
                    </Text>
                  </View>
                </ImageBackground>
              </View>
            ))}
          </View>
        </Section>

        {/* PRICING TIERS — dynamic from the admin-managed catalog */}
        {services.length > 0 ? (
          <Section title="Какая уборка нужна?" action={{ label: 'Все', onPress: () => router.push('/services') }}>
            <View style={{ gap: t.space[3] }}>
              {services.map((s, i) => {
                const featured = i === 1;
                return (
                  <Pressable
                    key={s.id}
                    onPress={() => router.push({ pathname: '/(tabs)/book', params: { slug: s.slug } })}
                    style={({ pressed }) => ({
                      backgroundColor: t.color.bg.surface,
                      borderColor: featured ? t.color.brand[500] : t.color.line.hairline,
                      borderWidth: featured ? 2 : 1,
                      borderRadius: t.radius.lg,
                      overflow: 'hidden',
                      transform: [{ scale: pressed ? 0.98 : 1 }],
                    })}
                  >
                    {s.photoUrl ? (
                      <Image source={{ uri: s.photoUrl }} resizeMode="cover" style={{ height: 130, width: '100%' }} />
                    ) : (
                      <View style={{ height: 90, backgroundColor: t.color.brand[100], alignItems: 'center', justifyContent: 'center' }}>
                        <Sparkles color={t.color.brand[500]} size={32} strokeWidth={2} />
                      </View>
                    )}
                    <View style={{ padding: t.space[4], gap: t.space[2] }}>
                      <Text style={{ color: t.color.ink.primary, fontSize: t.type.titleSm.fontSize, fontWeight: '800' }}>
                        {s.name}
                      </Text>
                      <Text style={{ color: t.color.brand[600], fontSize: t.type.titleMd.fontSize, fontWeight: '800' }}>
                        от {formatMoney(s.basePrice, s.currency)}{' '}
                        <Text style={{ color: t.color.ink.tertiary, fontSize: t.type.bodySm.fontSize, fontWeight: '400' }}>
                          / уборка
                        </Text>
                      </Text>
                      {s.description.length > 0 && (
                        <Text style={{ color: t.color.ink.secondary, fontSize: t.type.bodySm.fontSize, lineHeight: 20 }}>
                          {s.description}
                        </Text>
                      )}
                      <Button
                        variant={featured ? 'primary' : 'secondary'}
                        onPress={() => router.push({ pathname: '/(tabs)/book', params: { slug: s.slug } })}
                      >
                        Заказать
                      </Button>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </Section>
        ) : (
          // Fallback to static tiers if the catalog API is unavailable.
          <Section title="Какая уборка нужна?">
            <View style={{ gap: t.space[3] }}>
              {TIERS.map((tier) => (
                <View
                  key={tier.name}
                  style={{
                    backgroundColor: t.color.bg.surface,
                    borderColor: tier.featured ? t.color.brand[500] : t.color.line.hairline,
                    borderWidth: tier.featured ? 2 : 1,
                    borderRadius: t.radius.lg,
                    padding: t.space[4],
                    gap: t.space[2],
                  }}
                >
                  {tier.badge && (
                    <View
                      style={{
                        alignSelf: 'flex-start',
                        backgroundColor: t.color.brand[500],
                        paddingHorizontal: t.space[3],
                        paddingVertical: 4,
                        borderRadius: t.radius.pill,
                      }}
                    >
                      <Text style={{ color: t.color.ink.onBrand, fontSize: 11, fontWeight: '700' }}>{tier.badge}</Text>
                    </View>
                  )}
                  <Text style={{ color: t.color.ink.primary, fontSize: t.type.titleSm.fontSize, fontWeight: t.type.titleSm.fontWeight }}>
                    {tier.name}
                  </Text>
                  <Text style={{ color: t.color.brand[600], fontSize: t.type.titleMd.fontSize, fontWeight: '800' }}>
                    {tier.price}{' '}
                    <Text style={{ color: t.color.ink.tertiary, fontSize: t.type.bodySm.fontSize, fontWeight: '400' }}>
                      / уборка
                    </Text>
                  </Text>
                  <Text style={{ color: t.color.ink.secondary, fontSize: t.type.bodySm.fontSize }}>{tier.desc}</Text>
                  <View style={{ gap: 6, marginTop: t.space[1] }}>
                    {tier.items.map((it) => (
                      <View key={it} style={{ flexDirection: 'row', gap: t.space[2], alignItems: 'flex-start' }}>
                        <Text style={{ color: t.color.brand[500], fontWeight: '700' }}>✓</Text>
                        <Text style={{ color: t.color.ink.primary, fontSize: t.type.bodyMd.fontSize, flex: 1 }}>{it}</Text>
                      </View>
                    ))}
                  </View>
                  <Button variant={tier.featured ? 'primary' : 'secondary'} onPress={() => router.push('/(tabs)/book')}>
                    Заказать
                  </Button>
                </View>
              ))}
            </View>
          </Section>
        )}

        {/* WHY US */}
        <Section title="Почему выбирают нас">
          <View style={{ gap: t.space[4] }}>
            {WHY.map((w) => (
              <View key={w.title} style={{ flexDirection: 'row', gap: t.space[3], alignItems: 'flex-start' }}>
                <Text style={{ fontSize: 24 }}>{w.icon}</Text>
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={{ color: t.color.ink.primary, fontSize: t.type.labelLg.fontSize, fontWeight: '700' }}>
                    {w.title}
                  </Text>
                  <Text style={{ color: t.color.ink.secondary, fontSize: t.type.bodySm.fontSize, lineHeight: 20 }}>
                    {w.body}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </Section>

        {/* TOP CLEANERS */}
        {cleaners.length > 0 && (
          <Section
            title="Лучшие клинеры"
            action={{ label: 'Все', onPress: () => router.push('/cleaners') }}
          >
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: t.space[3], paddingRight: t.space[4] }}>
              {cleaners.map((c) => (
                <Pressable
                  key={c.id}
                  onPress={() => router.push(`/cleaners/${c.id}`)}
                  style={({ pressed }) => ({
                    width: 160,
                    borderRadius: t.radius.lg,
                    backgroundColor: t.color.bg.surface,
                    borderColor: t.color.line.hairline,
                    borderWidth: 1,
                    overflow: 'hidden',
                    transform: [{ scale: pressed ? 0.97 : 1 }],
                  })}
                >
                  <View style={{ height: 140, backgroundColor: t.color.brand[100], alignItems: 'center', justifyContent: 'center' }}>
                    {c.photoUrl ? (
                      <Image source={{ uri: c.photoUrl }} resizeMode="cover" style={{ width: '100%', height: '100%' }} />
                    ) : (
                      <Text style={{ fontSize: 44, fontWeight: '700', color: t.color.brand[500] }}>
                        {c.displayName.charAt(0)}
                      </Text>
                    )}
                  </View>
                  <View style={{ padding: t.space[3], gap: 2, alignItems: 'center' }}>
                    <Text numberOfLines={1} style={{ color: t.color.ink.primary, fontSize: t.type.labelLg.fontSize, fontWeight: '700' }}>
                      {c.displayName}
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <Star color={t.color.accent[500]} size={12} fill={t.color.accent[500]} />
                      <Text style={{ color: t.color.ink.secondary, fontSize: 12, fontWeight: '600' }}>
                        {(c.ratingAvg ?? 5).toFixed(1)}
                      </Text>
                    </View>
                    <Muted>{c.yearsOfExperience} лет опыта</Muted>
                  </View>
                </Pressable>
              ))}
            </ScrollView>
          </Section>
        )}

        {/* NAV GRID */}
        <Section title="Узнать больше">
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: t.space[3] }}>
            <NavTile
              icon={<Sparkles color={t.color.brand[500]} size={22} strokeWidth={2} />}
              title="Услуги"
              subtitle="Тарифы и опции"
              onPress={() => router.push('/services')}
            />
            <NavTile
              icon={<Users color={t.color.brand[500]} size={22} strokeWidth={2} />}
              title="Клинеры"
              subtitle="Профили команды"
              onPress={() => router.push('/cleaners')}
            />
            <NavTile
              icon={<Info color={t.color.brand[500]} size={22} strokeWidth={2} />}
              title="О нас"
              subtitle="Опыт и команда"
              onPress={() => router.push('/about')}
            />
            <NavTile
              icon={<Briefcase color={t.color.brand[500]} size={22} strokeWidth={2} />}
              title="Стать клинером"
              subtitle="Откликнуться"
              onPress={() => router.push('/careers')}
            />
            <NavTile
              icon={<MapPin color={t.color.brand[500]} size={22} strokeWidth={2} />}
              title="Контакты"
              subtitle="Связь и адрес"
              onPress={() => router.push('/contacts')}
            />
            <NavTile
              icon={<ShieldCheck color={t.color.brand[500]} size={22} strokeWidth={2} />}
              title="Документы"
              subtitle="Политика и условия"
              onPress={() => router.push('/privacy')}
            />
          </View>
        </Section>

        {/* FOOTER */}
        <View style={{ marginTop: t.space[6], backgroundColor: t.color.ink.primary, padding: t.space[6], gap: t.space[2] }}>
          <Text style={{ color: t.color.bg.surface, fontSize: t.type.titleMd.fontSize, fontWeight: '700' }}>
            Shine X
          </Text>
          <Text style={{ color: t.color.bg.surface, opacity: 0.7, fontSize: t.type.bodySm.fontSize }}>
            Профессиональная уборка квартир, домов и офисов
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: t.space[3], marginTop: t.space[3] }}>
            <FooterLink label="О нас" onPress={() => router.push('/about')} />
            <FooterLink label="Услуги" onPress={() => router.push('/services')} />
            <FooterLink label="Контакты" onPress={() => router.push('/contacts')} />
            <FooterLink label="Конфиденциальность" onPress={() => router.push('/privacy')} />
            <FooterLink label="Условия" onPress={() => router.push('/terms')} />
          </View>
          <Text style={{ color: t.color.bg.surface, opacity: 0.5, fontSize: t.type.labelSm.fontSize, marginTop: t.space[2] }}>
            © 2026 — Астана · пн–вс: 8:00–21:00
          </Text>
        </View>
      </ScrollView>
    </Screen>
  );
}

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  const t = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flex: 1,
        paddingVertical: t.space[3],
        paddingHorizontal: t.space[3],
        borderRadius: t.radius.lg,
        borderWidth: active ? 1.5 : 1,
        borderColor: active ? t.color.brand[500] : t.color.line.hairline,
        backgroundColor: active ? t.color.brand[100] : t.color.bg.surface,
        alignItems: 'center',
        transform: [{ scale: pressed ? 0.97 : 1 }],
      })}
    >
      <Text style={{ color: active ? t.color.brand[600] : t.color.ink.primary, fontWeight: '700', fontSize: t.type.labelLg.fontSize }}>
        {label}
      </Text>
    </Pressable>
  );
}

function Section({
  title,
  action,
  children,
}: {
  title: string;
  action?: { label: string; onPress: () => void };
  children: React.ReactNode;
}) {
  const t = useTheme();
  return (
    <View style={{ paddingHorizontal: t.space[4], marginTop: t.space[5], gap: t.space[3] }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={{ color: t.color.ink.primary, fontSize: t.type.titleMd.fontSize, fontWeight: t.type.titleMd.fontWeight }}>
          {title}
        </Text>
        {action && (
          <Pressable onPress={action.onPress} hitSlop={10}>
            <Text style={{ color: t.color.brand[500], fontSize: t.type.labelLg.fontSize, fontWeight: '700' }}>
              {action.label} →
            </Text>
          </Pressable>
        )}
      </View>
      {children}
    </View>
  );
}

function NavTile({
  icon,
  title,
  subtitle,
  onPress,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  onPress: () => void;
}) {
  const t = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        width: '47%',
        flexGrow: 1,
        padding: t.space[4],
        borderRadius: t.radius.lg,
        backgroundColor: t.color.bg.surface,
        borderColor: t.color.line.hairline,
        borderWidth: 1,
        gap: t.space[2],
        transform: [{ scale: pressed ? 0.97 : 1 }],
      })}
    >
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
      <Text style={{ color: t.color.ink.primary, fontSize: t.type.labelLg.fontSize, fontWeight: '700' }}>
        {title}
      </Text>
      <Text style={{ color: t.color.ink.secondary, fontSize: t.type.bodySm.fontSize }}>{subtitle}</Text>
    </Pressable>
  );
}

function FooterLink({ label, onPress }: { label: string; onPress: () => void }) {
  const t = useTheme();
  return (
    <Pressable onPress={onPress} hitSlop={6}>
      <Text style={{ color: t.color.bg.surface, opacity: 0.85, fontSize: t.type.bodySm.fontSize, textDecorationLine: 'underline' }}>
        {label}
      </Text>
    </Pressable>
  );
}
