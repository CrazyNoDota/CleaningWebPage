import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Button, Card, ErrorText, Field, Muted, Screen, Title } from '@/components/ui';
import { ApiError, requestOtp, verifyOtp } from '@/lib/api';
import { useSession } from '@/lib/session';

type Stage = 'phone' | 'code';

export default function LoginScreen() {
  const params = useLocalSearchParams<{ next?: string }>();
  const { setSession } = useSession();
  const [stage, setStage] = useState<Stage>('phone');
  const [phone, setPhone] = useState('+7');
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function sendCode() {
    setError(null);
    setBusy(true);
    try {
      await requestOtp(phone.trim());
      setStage('code');
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Не удалось отправить код');
    } finally {
      setBusy(false);
    }
  }

  async function verify() {
    setError(null);
    setBusy(true);
    try {
      const session = await verifyOtp(phone.trim(), code.trim(), name.trim());
      await setSession(session);
      router.replace(params.next ?? '/');
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Не удалось войти');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen padded={false}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Card>
            <Title>Вход по номеру телефона</Title>
            <Muted>Введите казахстанский номер в формате +77011234567.</Muted>
            <View style={styles.form}>
              <Field
                label="Телефон"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                placeholder="+77011234567"
              />
              {stage === 'code' && (
                <>
                  <Field
                    label="Имя"
                    value={name}
                    onChangeText={setName}
                    placeholder="Как к вам обращаться"
                  />
                  <Field
                    label="Код из SMS"
                    value={code}
                    onChangeText={(v) => setCode(v.replace(/\D/g, ''))}
                    keyboardType="number-pad"
                    placeholder="123456"
                  />
                </>
              )}
              <ErrorText>{error}</ErrorText>
              <Button onPress={stage === 'phone' ? sendCode : verify} disabled={busy}>
                {busy ? 'Загрузка...' : stage === 'phone' ? 'Получить код' : 'Войти'}
              </Button>
              {stage === 'code' && (
                <Button
                  variant="secondary"
                  onPress={() => {
                    setStage('phone');
                    setCode('');
                    setError(null);
                  }}
                  disabled={busy}
                >
                  Изменить номер
                </Button>
              )}
            </View>
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 16,
  },
  form: {
    gap: 14,
    marginTop: 18,
  },
});
