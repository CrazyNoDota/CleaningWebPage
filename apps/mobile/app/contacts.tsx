import { Linking, Pressable, ScrollView, Text, View } from 'react-native';
import { Clock, Mail, MapPin, Phone } from 'lucide-react-native';
import { Muted, Screen, Title } from '@/components/ui';
import { useTheme } from '@/lib/theme-provider';

const PHONE = '+7 (700) 301-84-05';
const EMAIL = 'sales@top.kz';

export default function ContactsScreen() {
  const t = useTheme();

  return (
    <Screen padded={false}>
      <ScrollView contentContainerStyle={{ padding: t.space[4], paddingBottom: t.space[8], gap: t.space[4] }}>
        <Title>Контакты</Title>

        <View style={{ gap: t.space[3] }}>
          <ContactRow
            icon={<Phone color={t.color.brand[500]} size={20} strokeWidth={2} />}
            label="Телефон"
            value={PHONE}
            onPress={() => Linking.openURL(`tel:${PHONE.replace(/[^+\d]/g, '')}`)}
          />
          <ContactRow
            icon={<Mail color={t.color.brand[500]} size={20} strokeWidth={2} />}
            label="Email"
            value={EMAIL}
            onPress={() => Linking.openURL(`mailto:${EMAIL}`)}
          />
          <ContactRow
            icon={<MapPin color={t.color.brand[500]} size={20} strokeWidth={2} />}
            label="Адрес"
            value="Астана, ул. Сыганак 32, ВП 33"
            onPress={() =>
              Linking.openURL('https://2gis.kz/astana/search/Сыганак 32')
            }
          />
          <ContactRow
            icon={<Clock color={t.color.brand[500]} size={20} strokeWidth={2} />}
            label="Часы работы"
            value="пн–вс: 8:00–21:00"
          />
        </View>
      </ScrollView>
    </Screen>
  );
}

function ContactRow({
  icon,
  label,
  value,
  onPress,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  onPress?: () => void;
}) {
  const t = useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: t.space[3],
        backgroundColor: t.color.bg.surface,
        borderColor: t.color.line.hairline,
        borderWidth: 1,
        borderRadius: t.radius.lg,
        padding: t.space[4],
        transform: [{ scale: pressed && onPress ? 0.98 : 1 }],
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
      <View style={{ flex: 1, gap: 2 }}>
        <Muted>{label}</Muted>
        <Text
          style={{
            color: onPress ? t.color.brand[600] : t.color.ink.primary,
            fontSize: t.type.bodyLg.fontSize,
            fontWeight: '600',
          }}
        >
          {value}
        </Text>
      </View>
    </Pressable>
  );
}
