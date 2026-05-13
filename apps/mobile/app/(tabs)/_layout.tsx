import { Tabs } from 'expo-router';
import { Text } from 'react-native';
import { colors } from '@/lib/theme';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: colors.card },
        headerShadowVisible: false,
        tabBarActiveTintColor: colors.brand,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.faint,
          minHeight: 64,
          paddingBottom: 10,
          paddingTop: 8,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Бронь',
          tabBarIcon: ({ color }) => <TabIcon color={color} label="+" />,
        }}
      />
      <Tabs.Screen
        name="orders/index"
        options={{
          title: 'Заказы',
          tabBarIcon: ({ color }) => <TabIcon color={color} label="≡" />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Профиль',
          tabBarIcon: ({ color }) => <TabIcon color={color} label="•" />,
        }}
      />
    </Tabs>
  );
}

function TabIcon({ color, label }: { color: string; label: string }) {
  return (
    <Text
      style={{
        color,
        fontSize: 18,
        fontWeight: '800',
        lineHeight: 18,
      }}
    >
      {label}
    </Text>
  );
}
