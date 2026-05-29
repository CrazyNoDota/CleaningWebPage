import { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { CheckCircle2 } from 'lucide-react-native';
import { Button, ErrorText, Field, Muted, Screen, Title } from '@/components/ui';
import { ApiError, submitApplication } from '@/lib/api';
import { useTheme } from '@/lib/theme-provider';

export default function CareersScreen() {
  const t = useTheme();
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('+7');
  const [city, setCity] = useState('');
  const [age, setAge] = useState('');
  const [experience, setExperience] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const phoneValid = /^\+\d{10,15}$/.test(phone.trim());
  const canSubmit = fullName.trim().length >= 2 && phoneValid && !busy;

  async function onSubmit() {
    setError(null);
    if (!canSubmit) {
      setError('Заполните ФИО и телефон в формате +77011234567');
      return;
    }
    setBusy(true);
    try {
      await submitApplication({
        fullName: fullName.trim(),
        phone: phone.trim(),
        cityFreeText: city.trim() || undefined,
        age: age ? Number(age) : undefined,
        experience: experience.trim() || undefined,
      });
      setDone(true);
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setError('С этого номера уже отправлена заявка за последние 24 часа.');
      } else {
        setError(err instanceof ApiError ? err.message : 'Не удалось отправить заявку');
      }
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <Screen>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: t.space[4], padding: t.space[6] }}>
          <CheckCircle2 color={t.color.brand[500]} size={64} strokeWidth={1.5} />
          <Title>Заявка отправлена!</Title>
          <Text style={{ color: t.color.ink.secondary, fontSize: t.type.bodyLg.fontSize, textAlign: 'center', lineHeight: 26 }}>
            Мы свяжемся с вами по указанному телефону.
          </Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen padded={false}>
      <ScrollView
        contentContainerStyle={{ padding: t.space[4], paddingBottom: t.space[10], gap: t.space[4] }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={{ gap: t.space[2] }}>
          <Title>Стать клинером</Title>
          <Muted>Заполните анкету — менеджер свяжется с вами в течение рабочего дня.</Muted>
        </View>

        <Field label="ФИО" value={fullName} onChangeText={setFullName} placeholder="Иван Иванов" />
        <Field
          label="Телефон"
          value={phone}
          onChangeText={setPhone}
          placeholder="+77011234567"
          keyboardType="phone-pad"
        />
        <Field label="Город" value={city} onChangeText={setCity} placeholder="Астана" />
        <Field label="Возраст" value={age} onChangeText={setAge} placeholder="30" keyboardType="number-pad" />
        <Field
          label="Опыт работы"
          value={experience}
          onChangeText={setExperience}
          placeholder="Где работали, на каких объектах"
          multiline
        />

        <ErrorText>{error}</ErrorText>

        <Button onPress={onSubmit} disabled={!canSubmit}>
          {busy ? 'Отправляем…' : 'Отправить заявку'}
        </Button>
      </ScrollView>
    </Screen>
  );
}
