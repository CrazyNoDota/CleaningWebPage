import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { Button, Card, Muted, Screen, Title } from '@/components/ui';
import { useSession } from '@/lib/session';

export default function ProfileScreen() {
  const { hydrated, session, signOut } = useSession();

  return (
    <Screen>
      <Card>
        <Title>Профиль</Title>
        {!hydrated && <Muted>Загрузка...</Muted>}
        {hydrated && !session && (
          <View style={styles.stack}>
            <Muted>Войдите, чтобы оформлять заказы и видеть историю уборок.</Muted>
            <Button onPress={() => router.push('/login')}>Войти</Button>
          </View>
        )}
        {session && (
          <View style={styles.stack}>
            <Muted>{session.user.name ?? 'Клиент'}</Muted>
            <Muted>{session.user.phone}</Muted>
            <Button variant="secondary" onPress={() => void signOut()}>
              Выйти
            </Button>
          </View>
        )}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  stack: {
    gap: 14,
    marginTop: 12,
  },
});
