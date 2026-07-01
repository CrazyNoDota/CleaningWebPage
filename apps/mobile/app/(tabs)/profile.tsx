import { useMemo } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import {
  Briefcase,
  ChevronRight,
  CreditCard,
  FileText,
  HelpCircle,
  Info,
  Languages,
  LogOut,
  MapPin,
  Monitor,
  Moon,
  Palette,
  ShieldCheck,
  Sparkles,
  Sun,
  Trash2,
  Users,
  UserPen,
} from 'lucide-react-native';
import { Button, Card, Muted, Screen, Title } from '@/components/ui';
import { deleteAccount } from '@/lib/api';
import { useSession } from '@/lib/session';
import { useTheme, useThemePref, type ThemePref } from '@/lib/theme-provider';

export default function ProfileScreen() {
  const { hydrated, session, signOut } = useSession();
  const t = useTheme();

  if (!hydrated) {
    return (
      <Screen>
        <Muted>Загрузка...</Muted>
      </Screen>
    );
  }

  if (!session) {
    return (
      <Screen padded={false}>
        <ScrollView contentContainerStyle={{ padding: t.space[4], paddingBottom: t.space[8], gap: t.space[4] }}>
          <View
            style={{
              backgroundColor: t.color.brand[500],
              borderRadius: t.radius.lg,
              padding: t.space[5],
              gap: t.space[3],
            }}
          >
            <Text style={{ color: t.color.ink.onBrand, fontSize: t.type.titleMd.fontSize, fontWeight: '800' }}>
              Войдите в аккаунт
            </Text>
            <Text style={{ color: t.color.ink.onBrand, opacity: 0.9, fontSize: t.type.bodyMd.fontSize }}>
              Чтобы оформлять заказы, сохранять адреса и видеть историю уборок.
            </Text>
            <View style={{ alignSelf: 'flex-start' }}>
              <Button variant="secondary" onPress={() => router.push('/login')}>
                Войти
              </Button>
            </View>
          </View>

          <Text style={{ color: t.color.ink.primary, fontSize: t.type.titleSm.fontSize, fontWeight: '800', marginTop: t.space[2] }}>
            О сервисе
          </Text>
          <View
            style={{
              backgroundColor: t.color.bg.surface,
              borderColor: t.color.line.hairline,
              borderRadius: t.radius.lg,
              borderWidth: 1,
              overflow: 'hidden',
            }}
          >
            <ListRow icon={<Info color={t.color.brand[500]} size={20} strokeWidth={2} />} title="О нас" onPress={() => router.push('/about')} />
            <Divider />
            <ListRow icon={<Sparkles color={t.color.brand[500]} size={20} strokeWidth={2} />} title="Услуги и цены" onPress={() => router.push('/services')} />
            <Divider />
            <ListRow icon={<Users color={t.color.brand[500]} size={20} strokeWidth={2} />} title="Наши клинеры" onPress={() => router.push('/cleaners')} />
            <Divider />
            <ListRow icon={<Briefcase color={t.color.brand[500]} size={20} strokeWidth={2} />} title="Стать клинером" onPress={() => router.push('/careers')} />
            <Divider />
            <ListRow icon={<MapPin color={t.color.brand[500]} size={20} strokeWidth={2} />} title="Контакты" onPress={() => router.push('/contacts')} />
          </View>

          <ThemeBlock />

          <Text style={{ color: t.color.ink.primary, fontSize: t.type.titleSm.fontSize, fontWeight: '800', marginTop: t.space[2] }}>
            Документы
          </Text>
          <View
            style={{
              backgroundColor: t.color.bg.surface,
              borderColor: t.color.line.hairline,
              borderRadius: t.radius.lg,
              borderWidth: 1,
              overflow: 'hidden',
            }}
          >
            <ListRow icon={<ShieldCheck color={t.color.brand[500]} size={20} strokeWidth={2} />} title="Конфиденциальность" onPress={() => router.push('/privacy')} />
            <Divider />
            <ListRow icon={<FileText color={t.color.brand[500]} size={20} strokeWidth={2} />} title="Условия использования" onPress={() => router.push('/terms')} />
          </View>

          <Footer />
        </ScrollView>
      </Screen>
    );
  }

  return (
    <Screen padded={false}>
      <ScrollView contentContainerStyle={{ padding: t.space[4], paddingBottom: t.space[8], gap: t.space[4] }}>
        <ProfileHeader name={session.user.name ?? 'Клиент'} phone={maskPhone(session.user.phone)} />
        <SettingsList />
        <ThemeBlock />
        <InfoPages />
        <SecondaryActions
          onSignOut={() => void signOut()}
          onDeleteAccount={() => {
            Alert.alert(
              'Удалить аккаунт?',
              'Все ваши данные будут удалены безвозвратно. Это действие нельзя отменить.',
              [
                { text: 'Отмена', style: 'cancel' },
                {
                  text: 'Удалить',
                  style: 'destructive',
                  onPress: () =>
                    Alert.alert(
                      'Подтвердите удаление',
                      'Аккаунт и все личные данные будут удалены навсегда. Продолжить?',
                      [
                        { text: 'Отмена', style: 'cancel' },
                        {
                          text: 'Да, удалить',
                          style: 'destructive',
                          onPress: () => {
                            deleteAccount()
                              .then(() => signOut())
                              .catch(() =>
                                Alert.alert('Ошибка', 'Не удалось удалить аккаунт. Попробуйте позже.'),
                              );
                          },
                        },
                      ],
                    ),
                },
              ],
            );
          }}
        />
        <Footer />
      </ScrollView>
    </Screen>
  );
}

function ProfileHeader({ name, phone }: { name: string; phone: string }) {
  const t = useTheme();
  const initials = useMemo(() => name.charAt(0).toUpperCase(), [name]);
  return (
    <View
      style={{
        backgroundColor: t.color.bg.surface,
        borderColor: t.color.line.hairline,
        borderRadius: t.radius.lg,
        borderWidth: 1,
        padding: t.space[5],
        flexDirection: 'row',
        alignItems: 'center',
        gap: t.space[4],
      }}
    >
      <View
        style={{
          alignItems: 'center',
          backgroundColor: t.color.brand[100],
          borderRadius: t.radius.pill,
          height: 64,
          justifyContent: 'center',
          width: 64,
        }}
      >
        <Text
          style={{
            color: t.color.brand[500],
            fontSize: t.type.titleLg.fontSize,
            fontWeight: t.type.titleLg.fontWeight,
          }}
        >
          {initials}
        </Text>
      </View>
      <View style={{ flex: 1, gap: t.space[1] }}>
        <Text
          style={{
            color: t.color.ink.primary,
            fontSize: t.type.titleMd.fontSize,
            lineHeight: t.type.titleMd.lineHeight,
            fontWeight: t.type.titleMd.fontWeight,
          }}
        >
          {name}
        </Text>
        <Text
          style={{
            color: t.color.ink.secondary,
            fontSize: t.type.bodyMd.fontSize,
            lineHeight: t.type.bodyMd.lineHeight,
          }}
        >
          {phone}
        </Text>
      </View>
      <Pressable
        accessibilityLabel="Редактировать"
        hitSlop={10}
        style={{ padding: t.space[2] }}
      >
        <UserPen color={t.color.ink.tertiary} size={20} strokeWidth={2} />
      </Pressable>
    </View>
  );
}

function SettingsList() {
  const t = useTheme();
  const comingSoon = (title: string) =>
    Alert.alert(title, 'Раздел появится в одном из ближайших обновлений.');
  return (
    <View
      style={{
        backgroundColor: t.color.bg.surface,
        borderColor: t.color.line.hairline,
        borderRadius: t.radius.lg,
        borderWidth: 1,
        overflow: 'hidden',
      }}
    >
      <ListRow
        icon={<MapPin color={t.color.brand[500]} size={20} strokeWidth={2} />}
        title="Мои адреса"
        onPress={() => comingSoon('Мои адреса')}
      />
      <Divider />
      <ListRow
        icon={<CreditCard color={t.color.brand[500]} size={20} strokeWidth={2} />}
        title="Способы оплаты"
        onPress={() => comingSoon('Способы оплаты')}
      />
      <Divider />
      <ListRow
        icon={<Languages color={t.color.brand[500]} size={20} strokeWidth={2} />}
        title="Язык"
        subtitle="Русский"
        onPress={() => comingSoon('Выбор языка')}
      />
    </View>
  );
}

function ThemeBlock() {
  const t = useTheme();
  const { pref, setPref } = useThemePref();
  const options: { value: ThemePref; label: string; icon: React.ReactNode }[] = [
    { value: 'light', label: 'Светлая', icon: <Sun size={18} color={pref === 'light' ? t.color.brand[500] : t.color.ink.secondary} strokeWidth={2} /> },
    { value: 'dark', label: 'Тёмная', icon: <Moon size={18} color={pref === 'dark' ? t.color.brand[500] : t.color.ink.secondary} strokeWidth={2} /> },
    { value: 'system', label: 'Система', icon: <Monitor size={18} color={pref === 'system' ? t.color.brand[500] : t.color.ink.secondary} strokeWidth={2} /> },
  ];
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
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.space[3] }}>
        <Palette color={t.color.brand[500]} size={20} strokeWidth={2} />
        <Text
          style={{
            color: t.color.ink.primary,
            fontSize: t.type.titleSm.fontSize,
            fontWeight: t.type.titleSm.fontWeight,
          }}
        >
          Тема
        </Text>
      </View>
      <View style={{ flexDirection: 'row', gap: t.space[2] }}>
        {options.map((o) => {
          const active = pref === o.value;
          return (
            <Pressable
              key={o.value}
              onPress={() => setPref(o.value)}
              style={{
                flex: 1,
                alignItems: 'center',
                gap: t.space[1],
                paddingVertical: t.space[3],
                borderRadius: t.radius.md,
                backgroundColor: active ? t.color.brand[100] : t.color.bg.sunken,
                borderWidth: 1,
                borderColor: active ? t.color.brand[500] : 'transparent',
              }}
            >
              {o.icon}
              <Text
                style={{
                  color: active ? t.color.brand[500] : t.color.ink.secondary,
                  fontSize: t.type.labelSm.fontSize,
                  fontWeight: t.type.labelSm.fontWeight,
                }}
              >
                {o.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function InfoPages() {
  const t = useTheme();
  return (
    <View
      style={{
        backgroundColor: t.color.bg.surface,
        borderColor: t.color.line.hairline,
        borderRadius: t.radius.lg,
        borderWidth: 1,
        overflow: 'hidden',
      }}
    >
      <ListRow icon={<Info color={t.color.brand[500]} size={20} strokeWidth={2} />} title="О нас" onPress={() => router.push('/about')} />
      <Divider />
      <ListRow icon={<Sparkles color={t.color.brand[500]} size={20} strokeWidth={2} />} title="Услуги и цены" onPress={() => router.push('/services')} />
      <Divider />
      <ListRow icon={<Users color={t.color.brand[500]} size={20} strokeWidth={2} />} title="Наши клинеры" onPress={() => router.push('/cleaners')} />
      <Divider />
      <ListRow icon={<Briefcase color={t.color.brand[500]} size={20} strokeWidth={2} />} title="Стать клинером" onPress={() => router.push('/careers')} />
      <Divider />
      <ListRow icon={<FileText color={t.color.brand[500]} size={20} strokeWidth={2} />} title="Условия использования" onPress={() => router.push('/terms')} />
    </View>
  );
}

function SecondaryActions({ onSignOut, onDeleteAccount }: { onSignOut: () => void; onDeleteAccount: () => void }) {
  const t = useTheme();
  return (
    <View
      style={{
        backgroundColor: t.color.bg.surface,
        borderColor: t.color.line.hairline,
        borderRadius: t.radius.lg,
        borderWidth: 1,
        overflow: 'hidden',
      }}
    >
      <ListRow icon={<ShieldCheck color={t.color.brand[500]} size={20} strokeWidth={2} />} title="Конфиденциальность" onPress={() => router.push('/privacy')} />
      <Divider />
      <ListRow icon={<HelpCircle color={t.color.brand[500]} size={20} strokeWidth={2} />} title="Служба поддержки" onPress={() => router.push('/contacts')} />
      <Divider />
      <Pressable
        onPress={onSignOut}
        style={({ pressed }) => [
          {
            flexDirection: 'row',
            alignItems: 'center',
            gap: t.space[3],
            paddingHorizontal: t.space[4],
            paddingVertical: t.space[4],
            opacity: pressed ? 0.6 : 1,
          },
        ]}
      >
        <LogOut color={t.color.danger[500]} size={20} strokeWidth={2} />
        <Text
          style={{
            color: t.color.danger[500],
            fontSize: t.type.labelLg.fontSize,
            fontWeight: t.type.labelLg.fontWeight,
            flex: 1,
          }}
        >
          Выйти
        </Text>
      </Pressable>
      <Divider />
      <Pressable
        onPress={onDeleteAccount}
        style={({ pressed }) => [
          {
            flexDirection: 'row',
            alignItems: 'center',
            gap: t.space[3],
            paddingHorizontal: t.space[4],
            paddingVertical: t.space[4],
            opacity: pressed ? 0.6 : 1,
          },
        ]}
      >
        <Trash2 color={t.color.danger[500]} size={20} strokeWidth={2} />
        <Text
          style={{
            color: t.color.danger[500],
            fontSize: t.type.labelLg.fontSize,
            fontWeight: t.type.labelLg.fontWeight,
            flex: 1,
          }}
        >
          Удалить аккаунт
        </Text>
      </Pressable>
    </View>
  );
}

function ListRow({
  icon,
  title,
  subtitle,
  onPress,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  onPress?: () => void;
}) {
  const t = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        {
          flexDirection: 'row',
          alignItems: 'center',
          gap: t.space[3],
          paddingHorizontal: t.space[4],
          paddingVertical: t.space[4],
          opacity: pressed ? 0.6 : 1,
        },
      ]}
    >
      {icon}
      <View style={{ flex: 1, gap: 2 }}>
        <Text
          style={{
            color: t.color.ink.primary,
            fontSize: t.type.bodyLg.fontSize,
            fontWeight: t.type.labelLg.fontWeight,
          }}
        >
          {title}
        </Text>
        {subtitle && (
          <Text style={{ color: t.color.ink.secondary, fontSize: t.type.bodySm.fontSize }}>{subtitle}</Text>
        )}
      </View>
      <ChevronRight color={t.color.ink.tertiary} size={18} strokeWidth={2} />
    </Pressable>
  );
}

function Divider() {
  const t = useTheme();
  return <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: t.color.line.hairline, marginLeft: t.space[7] + t.space[3] }} />;
}

function Footer() {
  const t = useTheme();
  return (
    <View style={{ alignItems: 'center', gap: 2, marginTop: t.space[2] }}>
      <Text style={{ color: t.color.ink.tertiary, fontSize: t.type.bodySm.fontSize }}>Shine X • Astana</Text>
      <Text style={{ color: t.color.ink.tertiary, fontSize: t.type.labelSm.fontSize }}>v0.0.1</Text>
    </View>
  );
}

function maskPhone(phone: string | null): string {
  if (!phone) return '—';
  if (phone.length < 6) return phone;
  const tail = phone.slice(-2);
  const head = phone.slice(0, 5);
  return `${head} ••• •• ${tail}`;
}
