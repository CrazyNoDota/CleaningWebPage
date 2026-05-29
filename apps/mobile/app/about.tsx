import { ImageBackground, ScrollView, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Button, Muted, Screen, Title } from '@/components/ui';
import { useTheme } from '@/lib/theme-provider';

const HERO = require('../assets/img/clean_living_room_supplies.jpg');

const STATS = [
  { label: 'лет на рынке', value: '8 лет' },
  { label: 'клинеров', value: '1 000+' },
  { label: 'Centras Insurance', value: '16 млн ₸' },
];

export default function AboutScreen() {
  const t = useTheme();
  return (
    <Screen padded={false}>
      <ScrollView contentContainerStyle={{ paddingBottom: t.space[8] }}>
        <ImageBackground source={HERO} resizeMode="cover" style={{ height: 200 }} imageStyle={{ opacity: 0.6 }}>
          <View style={{ flex: 1, backgroundColor: 'rgba(0,30,40,0.55)', padding: t.space[5], justifyContent: 'flex-end' }}>
            <Text style={{ color: '#fff', fontSize: 28, fontWeight: '800', lineHeight: 32 }}>О нас</Text>
            <Text style={{ color: '#fff', opacity: 0.9, fontSize: t.type.bodyLg.fontSize, marginTop: 4 }}>
              Профессиональная команда Shine X в Астане
            </Text>
          </View>
        </ImageBackground>

        <View style={{ padding: t.space[4], gap: t.space[4] }}>
          <Text style={{ color: t.color.ink.primary, fontSize: t.type.bodyLg.fontSize, lineHeight: 26 }}>
            Убираем квартиры, дома и офисы в Астане. Клинер приезжает вовремя, работает по чек-листу, а
            менеджер остаётся на связи до завершения заказа.
          </Text>

          <View
            style={{
              borderRadius: t.radius.lg,
              borderWidth: 1,
              borderColor: t.color.line.hairline,
              backgroundColor: t.color.bg.surface,
              overflow: 'hidden',
            }}
          >
            {STATS.map((s, i) => (
              <View
                key={s.label}
                style={{
                  padding: t.space[4],
                  borderTopWidth: i === 0 ? 0 : 1,
                  borderTopColor: t.color.line.hairline,
                  gap: 4,
                }}
              >
                <Muted>{s.label}</Muted>
                <Text style={{ color: t.color.brand[600], fontSize: t.type.titleMd.fontSize, fontWeight: '800' }}>
                  {s.value}
                </Text>
              </View>
            ))}
          </View>

          <Title>Что мы делаем</Title>
          <Text style={{ color: t.color.ink.primary, fontSize: t.type.bodyMd.fontSize, lineHeight: 24 }}>
            Поддерживающая уборка, генеральная и после ремонта — для квартир, частных домов, коттеджей и
            коммерческих помещений. Команда проходит обучение и проверку.
          </Text>

          <View style={{ flexDirection: 'row', gap: t.space[3], marginTop: t.space[2] }}>
            <View style={{ flex: 1 }}>
              <Button onPress={() => router.push('/(tabs)/book')}>Заказать уборку</Button>
            </View>
            <View style={{ flex: 1 }}>
              <Button variant="secondary" onPress={() => router.push('/contacts')}>
                Связаться
              </Button>
            </View>
          </View>
        </View>
      </ScrollView>
    </Screen>
  );
}
