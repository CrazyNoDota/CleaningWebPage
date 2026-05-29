import 'react-native-gesture-handler';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SessionProvider } from '@/lib/session';
import { ThemeProvider, useTheme } from '@/lib/theme-provider';

function ThemedStack() {
  const t = useTheme();
  return (
    <>
      <StatusBar style={t.scheme === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: t.color.bg.surface },
          headerShadowVisible: false,
          headerTintColor: t.color.ink.primary,
          headerTitleStyle: { fontWeight: '600' },
          contentStyle: { backgroundColor: t.color.bg.page },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ title: 'Вход' }} />
        <Stack.Screen name="orders/[id]" options={{ title: 'Заказ' }} />
        <Stack.Screen name="cleaners/[id]" options={{ title: 'Клинер' }} />
        <Stack.Screen name="services" options={{ title: 'Услуги' }} />
        <Stack.Screen name="cleaners/index" options={{ title: 'Клинеры' }} />
        <Stack.Screen name="about" options={{ title: 'О нас' }} />
        <Stack.Screen name="contacts" options={{ title: 'Контакты' }} />
        <Stack.Screen name="careers" options={{ title: 'Стать клинером' }} />
        <Stack.Screen name="privacy" options={{ title: 'Конфиденциальность' }} />
        <Stack.Screen name="terms" options={{ title: 'Условия' }} />
        <Stack.Screen name="booking-confirmation" options={{ title: 'Заказ создан' }} />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <SessionProvider>
        <ThemedStack />
      </SessionProvider>
    </ThemeProvider>
  );
}
