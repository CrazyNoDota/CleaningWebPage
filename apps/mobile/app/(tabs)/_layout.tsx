import { Tabs } from 'expo-router';
import { CalendarDays, Home, ReceiptText, User } from 'lucide-react-native';
import { useTheme } from '@/lib/theme-provider';

export default function TabsLayout() {
  const t = useTheme();
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: t.color.bg.surface },
        headerTitleStyle: {
          color: t.color.ink.primary,
          fontSize: t.type.titleSm.fontSize,
          fontWeight: t.type.titleSm.fontWeight,
        },
        headerShadowVisible: false,
        tabBarActiveTintColor: t.color.brand[500],
        tabBarInactiveTintColor: t.color.ink.tertiary,
        tabBarLabelStyle: {
          fontSize: t.type.labelSm.fontSize,
          lineHeight: t.type.labelSm.lineHeight,
          fontWeight: t.type.labelSm.fontWeight,
        },
        tabBarStyle: {
          backgroundColor: t.color.bg.surface,
          borderTopColor: t.color.line.hairline,
          minHeight: 64,
          paddingBottom: 10,
          paddingTop: 8,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Главная',
          headerShown: false,
          tabBarIcon: ({ color, size }) => <Home color={color} size={size ?? 22} strokeWidth={2} />,
        }}
      />
      <Tabs.Screen
        name="book"
        options={{
          title: 'Бронь',
          tabBarIcon: ({ color, size }) => <CalendarDays color={color} size={size ?? 22} strokeWidth={2} />,
        }}
      />
      <Tabs.Screen
        name="orders/index"
        options={{
          title: 'Заказы',
          tabBarIcon: ({ color, size }) => <ReceiptText color={color} size={size ?? 22} strokeWidth={2} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Профиль',
          tabBarIcon: ({ color, size }) => <User color={color} size={size ?? 22} strokeWidth={2} />,
        }}
      />
    </Tabs>
  );
}
