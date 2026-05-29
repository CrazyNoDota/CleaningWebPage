import { useState } from 'react';
import { ImageBackground, Pressable, ScrollView, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Building2, Home, Shirt, Sparkles, SprayCan, Wand2, Wind, Wrench } from 'lucide-react-native';
import { Button, Muted, Screen, Title } from '@/components/ui';
import { useTheme } from '@/lib/theme-provider';

type Tier = {
  key: 'maintenance' | 'deep' | 'renovation';
  name: string;
  price: string;
  desc: string;
  items: string[];
  Icon: typeof Sparkles;
  img: number;
};

const TIERS: Tier[] = [
  {
    key: 'maintenance',
    name: 'Поддерживающая',
    price: 'от 12 750 ₸',
    desc: 'Для поддержания дома в чистоте и порядке',
    items: ['Профессиональные средства', 'Собираем мусор', 'Пылесосим и моем полы'],
    Icon: Sparkles,
    img: require('../assets/img/pro_living.png'),
  },
  {
    key: 'deep',
    name: 'Генеральная',
    price: 'от 27 119 ₸',
    desc: 'Комфорт с дополнительными опциями',
    items: ['Моем окна с внутренней стороны', 'Вдвое больше мастеров', 'Кафель на кухне и санузле'],
    Icon: Wand2,
    img: require('../assets/img/pro_kitchen.png'),
  },
  {
    key: 'renovation',
    name: 'После ремонта',
    price: 'от 43 500 ₸',
    desc: 'Удаляем послеремонтную пыль со всех поверхностей',
    items: ['Удаляем строительную пыль', 'Удаляем остатки клея', 'Моем кафель на стенах'],
    Icon: Wrench,
    img: require('../assets/img/pro_bathroom.png'),
  },
];

type Audience = 'home' | 'business';

const CATEGORIES: Record<Audience, Array<{ key: string; name: string; desc: string; Icon: typeof Sparkles }>> = {
  home: [
    { key: 'cleaning', name: 'Уборка', desc: 'Поддерживающая, генеральная, после ремонта', Icon: Sparkles },
    { key: 'windows', name: 'Мойка окон', desc: 'Внутри и снаружи при безопасном доступе', Icon: Wind },
    { key: 'drycleaning', name: 'Химчистка', desc: 'Диваны, ковры, матрасы', Icon: SprayCan },
    { key: 'ironing', name: 'Глажка', desc: 'Шторы, постельное, одежда', Icon: Shirt },
    { key: 'steam', name: 'Чистка паром', desc: 'Дезинфекция твердых поверхностей', Icon: Wand2 },
    { key: 'renovation', name: 'После ремонта', desc: 'Снимаем строительную пыль', Icon: Wrench },
  ],
  business: [
    { key: 'office', name: 'Офисы', desc: 'Регулярная и разовая уборка офисов', Icon: Building2 },
    { key: 'commercial', name: 'Коммерция', desc: 'Магазины, кафе, салоны', Icon: Sparkles },
    { key: 'cottages', name: 'Коттеджи и БЦ', desc: 'Большие площади, выезд бригады', Icon: Home },
    { key: 'postrenovation', name: 'После ремонта', desc: 'Объектная уборка после стройки', Icon: Wrench },
  ],
};

const SCENES = [
  { name: 'Квартиры', img: require('../assets/img/service_house.jpg') },
  { name: 'Офисы', img: require('../assets/img/service_office.jpg') },
  { name: 'Коттеджи', img: require('../assets/img/service_cottage.jpg') },
  { name: 'Коммерция', img: require('../assets/img/service_commercial.jpg') },
];

export default function ServicesScreen() {
  const t = useTheme();
  const [audience, setAudience] = useState<Audience>('home');

  return (
    <Screen padded={false}>
      <ScrollView contentContainerStyle={{ padding: t.space[4], paddingBottom: t.space[8], gap: t.space[4] }}>
        <View style={{ gap: t.space[2] }}>
          <Title>Услуги</Title>
          <Muted>Полный список услуг и цены</Muted>
        </View>

        {/* AUDIENCE TOGGLE — top.kz style */}
        <View style={{ flexDirection: 'row', gap: t.space[2] }}>
          <Pill label="Для дома" active={audience === 'home'} onPress={() => setAudience('home')} />
          <Pill label="Для бизнеса" active={audience === 'business'} onPress={() => setAudience('business')} />
        </View>

        {/* CATEGORY LIST */}
        <View style={{ gap: t.space[2] }}>
          {CATEGORIES[audience].map((c) => (
            <Pressable
              key={c.key}
              onPress={() => router.push('/(tabs)/book')}
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
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
                  width: 48,
                  height: 48,
                  borderRadius: t.radius.md,
                  backgroundColor: t.color.brand[100],
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <c.Icon color={t.color.brand[500]} size={24} strokeWidth={2} />
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={{ color: t.color.ink.primary, fontSize: t.type.titleSm.fontSize, fontWeight: '800' }}>
                  {c.name}
                </Text>
                <Text style={{ color: t.color.ink.secondary, fontSize: t.type.bodySm.fontSize }}>{c.desc}</Text>
              </View>
              <Text style={{ color: t.color.ink.tertiary, fontSize: 18 }}>›</Text>
            </Pressable>
          ))}
        </View>

        {/* TIER CARDS (only for home audience) */}
        {audience === 'home' && (
          <>
            <Text style={{ color: t.color.ink.primary, fontSize: t.type.titleSm.fontSize, fontWeight: t.type.titleSm.fontWeight, marginTop: t.space[2] }}>
              Тарифы уборки
            </Text>
            <View style={{ gap: t.space[4] }}>
              {TIERS.map(({ key, name, price, desc, items, Icon, img }) => (
                <View
                  key={key}
                  style={{
                    backgroundColor: t.color.bg.surface,
                    borderColor: t.color.line.hairline,
                    borderWidth: 1,
                    borderRadius: t.radius.lg,
                    overflow: 'hidden',
                  }}
                >
                  <ImageBackground source={img} resizeMode="cover" style={{ height: 140 }} imageStyle={{ opacity: 0.85 }}>
                    <View
                      style={{
                        flex: 1,
                        backgroundColor: 'rgba(0,20,30,0.35)',
                        padding: t.space[4],
                        justifyContent: 'flex-end',
                      }}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.space[2] }}>
                        <View
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: t.radius.md,
                            backgroundColor: 'rgba(255,255,255,0.9)',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Icon color={t.color.brand[500]} size={20} strokeWidth={2} />
                        </View>
                        <Text style={{ color: '#fff', fontSize: t.type.titleSm.fontSize, fontWeight: '800' }}>
                          {name}
                        </Text>
                      </View>
                    </View>
                  </ImageBackground>

                  <View style={{ padding: t.space[4], gap: t.space[3] }}>
                    <Text style={{ color: t.color.brand[600], fontSize: t.type.titleMd.fontSize, fontWeight: '800' }}>
                      {price}{' '}
                      <Text style={{ color: t.color.ink.tertiary, fontSize: t.type.bodySm.fontSize, fontWeight: '400' }}>
                        / уборка
                      </Text>
                    </Text>
                    <Text style={{ color: t.color.ink.secondary, fontSize: t.type.bodySm.fontSize }}>{desc}</Text>

                    <View style={{ gap: t.space[2] }}>
                      {items.map((item) => (
                        <View key={item} style={{ flexDirection: 'row', gap: t.space[2], alignItems: 'flex-start' }}>
                          <Text style={{ color: t.color.brand[500], fontWeight: '700' }}>✓</Text>
                          <Text style={{ color: t.color.ink.primary, fontSize: t.type.bodyMd.fontSize, flex: 1, lineHeight: 22 }}>
                            {item}
                          </Text>
                        </View>
                      ))}
                    </View>

                    <Button onPress={() => router.push('/(tabs)/book')}>Заказать</Button>
                  </View>
                </View>
              ))}
            </View>
          </>
        )}

        {/* SCENES grid */}
        <View style={{ gap: t.space[3], marginTop: t.space[3] }}>
          <Text style={{ color: t.color.ink.primary, fontSize: t.type.titleSm.fontSize, fontWeight: t.type.titleSm.fontWeight }}>
            Где работаем
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: t.space[3] }}>
            {SCENES.map((s) => (
              <View
                key={s.name}
                style={{
                  width: '47%',
                  height: 110,
                  borderRadius: t.radius.md,
                  overflow: 'hidden',
                  backgroundColor: t.color.brand[100],
                }}
              >
                <ImageBackground source={s.img} resizeMode="cover" style={{ flex: 1, justifyContent: 'flex-end' }}>
                  <View style={{ backgroundColor: 'rgba(0,0,0,0.45)', padding: t.space[3] }}>
                    <Text style={{ color: '#fff', fontSize: t.type.labelLg.fontSize, fontWeight: '700' }}>{s.name}</Text>
                  </View>
                </ImageBackground>
              </View>
            ))}
          </View>
        </View>
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
