import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import Constants from 'expo-constants';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { Button, ErrorText, Screen } from '@/components/ui';
import { ApiError, googleLogin, requestOtp, verifyOtp } from '@/lib/api';
import { useSession } from '@/lib/session';
import { useTheme } from '@/lib/theme-provider';

// Closes the in-app browser tab once Google redirects back to the app.
WebBrowser.maybeCompleteAuthSession();

type Stage = 'phone' | 'code';

const OTP_LENGTH = 6;
const RESEND_SECONDS = 59;

const googleExtra = Constants.expoConfig?.extra as
  | { googleClientIdWeb?: string; googleClientIdAndroid?: string; googleClientIdIos?: string }
  | undefined;
const GOOGLE_CLIENT_ID_WEB = googleExtra?.googleClientIdWeb || undefined;
const GOOGLE_CLIENT_ID_ANDROID = googleExtra?.googleClientIdAndroid || undefined;
const GOOGLE_CLIENT_ID_IOS = googleExtra?.googleClientIdIos || undefined;
const GOOGLE_ENABLED = Boolean(
  GOOGLE_CLIENT_ID_WEB || GOOGLE_CLIENT_ID_ANDROID || GOOGLE_CLIENT_ID_IOS,
);
// Native Android returns the ID token to this app-scheme redirect (matches android.package).
const GOOGLE_ANDROID_REDIRECT_URI = 'kz.shinex.app:/oauthredirect';

export default function LoginScreen() {
  const t = useTheme();
  const params = useLocalSearchParams<{ next?: string }>();
  const { setSession } = useSession();
  const [stage, setStage] = useState<Stage>('phone');
  // Phone is stored as a 10-digit local number; +7 is prepended on submit.
  const [phoneLocal, setPhoneLocal] = useState('');
  const [name, setName] = useState('');
  const [otp, setOtp] = useState<string[]>(() => Array(OTP_LENGTH).fill(''));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendIn, setResendIn] = useState(0);
  const [googleBusy, setGoogleBusy] = useState(false);

  // expo-auth-session Google flow — yields an ID token we exchange for our own session.
  const [googleRequest, googleResponse, promptGoogle] = Google.useIdTokenAuthRequest({
    webClientId: GOOGLE_CLIENT_ID_WEB,
    androidClientId: GOOGLE_CLIENT_ID_ANDROID,
    iosClientId: GOOGLE_CLIENT_ID_IOS,
    redirectUri: Platform.OS === 'android' ? GOOGLE_ANDROID_REDIRECT_URI : undefined,
  });

  const otpRefs = useRef<Array<TextInput | null>>([]);
  const fullPhone = `+7${phoneLocal}`;
  const codeJoined = otp.join('');
  const phoneValid = phoneLocal.length === 10;

  const displayPhone = useMemo(() => {
    if (phoneLocal.length !== 10) return fullPhone;
    return `+7 (${phoneLocal.slice(0, 3)}) ${phoneLocal.slice(3, 6)}-${phoneLocal.slice(6, 8)}-${phoneLocal.slice(8, 10)}`;
  }, [phoneLocal, fullPhone]);

  useEffect(() => {
    if (resendIn <= 0) return;
    const handle = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(handle);
  }, [resendIn]);

  // React to the Google OAuth result: exchange the ID token for our session.
  useEffect(() => {
    if (!googleResponse) return;
    if (googleResponse.type === 'success') {
      const idToken =
        googleResponse.params?.id_token ?? googleResponse.authentication?.idToken;
      if (!idToken) {
        setGoogleBusy(false);
        setError('Google не вернул токен');
        return;
      }
      (async () => {
        try {
          const session = await googleLogin(idToken);
          await setSession(session);
          router.replace(params.next ?? '/');
        } catch (e) {
          setError(e instanceof ApiError ? e.message : 'Не удалось войти через Google');
        } finally {
          setGoogleBusy(false);
        }
      })();
    } else if (googleResponse.type === 'error') {
      setGoogleBusy(false);
      setError(googleResponse.error?.message ?? 'Не удалось войти через Google');
    } else {
      // 'cancel' / 'dismiss'
      setGoogleBusy(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [googleResponse]);

  async function signInWithGoogle() {
    if (!GOOGLE_ENABLED) {
      Alert.alert('Скоро', 'Вход через Google ещё не настроен в этой сборке.');
      return;
    }
    if (!googleRequest) return;
    setError(null);
    setGoogleBusy(true);
    try {
      await promptGoogle();
    } catch {
      setGoogleBusy(false);
      setError('Не удалось открыть Google вход');
    }
  }

  async function sendCode() {
    setError(null);
    if (!phoneValid) {
      setError('Введите корректный номер');
      return;
    }
    setBusy(true);
    try {
      await requestOtp(fullPhone);
      setStage('code');
      setResendIn(RESEND_SECONDS);
      setTimeout(() => otpRefs.current[0]?.focus(), 50);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Не удалось отправить код');
    } finally {
      setBusy(false);
    }
  }

  async function verify() {
    setError(null);
    if (codeJoined.length !== OTP_LENGTH) {
      setError(`Введите ${OTP_LENGTH}-значный код`);
      return;
    }
    setBusy(true);
    try {
      const session = await verifyOtp(fullPhone, codeJoined, name.trim());
      await setSession(session);
      router.replace(params.next ?? '/');
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Не удалось войти');
    } finally {
      setBusy(false);
    }
  }

  function setOtpDigit(index: number, value: string) {
    const digit = value.replace(/\D/g, '').slice(-1);
    setOtp((prev) => {
      const next = [...prev];
      next[index] = digit;
      return next;
    });
    if (digit && index < OTP_LENGTH - 1) {
      otpRefs.current[index + 1]?.focus();
    }
  }

  function onOtpKey(index: number, key: string) {
    if (key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  }

  function backToPhone() {
    setStage('phone');
    setOtp(Array(OTP_LENGTH).fill(''));
    setError(null);
  }

  async function resend() {
    if (resendIn > 0) return;
    setError(null);
    setBusy(true);
    try {
      await requestOtp(fullPhone);
      setResendIn(RESEND_SECONDS);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Не удалось отправить код');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen padded={false}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: 'center',
            paddingHorizontal: t.space[4],
            paddingVertical: t.space[8],
            gap: t.space[7],
          }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Hero */}
          <View style={{ alignItems: 'center', gap: t.space[3] }}>
            <View
              style={{
                width: 88,
                height: 88,
                borderRadius: t.radius.lg,
                backgroundColor: t.color.brand[500],
                alignItems: 'center',
                justifyContent: 'center',
                ...t.elevation.sheet,
                shadowOpacity: 0.08,
                shadowRadius: 24,
              }}
            >
              <Text
                style={{
                  color: t.color.ink.onBrand,
                  fontSize: 44,
                  lineHeight: 48,
                  fontWeight: '700',
                  letterSpacing: -1,
                }}
              >
                S
              </Text>
            </View>
            <Text
              style={{
                color: t.color.brand[500],
                fontSize: t.type.displayLg.fontSize,
                lineHeight: t.type.displayLg.lineHeight,
                fontWeight: t.type.displayLg.fontWeight,
                letterSpacing: t.type.displayLg.letterSpacing,
              }}
            >
              Shine X
            </Text>
            <Text
              style={{
                color: t.color.ink.secondary,
                fontSize: t.type.bodyMd.fontSize,
                lineHeight: t.type.bodyMd.lineHeight,
              }}
            >
              Профессиональный клининг в Астане
            </Text>
          </View>

          {/* Form card */}
          {stage === 'phone' ? (
            <PhoneStage
              theme={t}
              phoneLocal={phoneLocal}
              onPhoneChange={(v) => {
                setPhoneLocal(v.replace(/\D/g, '').slice(0, 10));
                if (error) setError(null);
              }}
              onSubmit={sendCode}
              busy={busy}
              error={error}
              phoneValid={phoneValid}
              onGoogle={signInWithGoogle}
              googleBusy={googleBusy}
              googleDisabled={GOOGLE_ENABLED && !googleRequest}
            />
          ) : (
            <OtpStage
              theme={t}
              displayPhone={displayPhone}
              otp={otp}
              otpRefs={otpRefs}
              onDigit={setOtpDigit}
              onKey={onOtpKey}
              name={name}
              onNameChange={setName}
              onSubmit={verify}
              onBack={backToPhone}
              onResend={resend}
              busy={busy}
              error={error}
              resendIn={resendIn}
            />
          )}

          {/* Footer */}
          <Text
            style={{
              color: t.color.ink.tertiary,
              fontSize: t.type.labelSm.fontSize,
              lineHeight: 18,
              textAlign: 'center',
              opacity: 0.85,
            }}
          >
            Нажимая «Получить код», вы соглашаетесь с{' '}
            <Text style={{ textDecorationLine: 'underline' }}>Пользовательским соглашением</Text>{' '}
            и <Text style={{ textDecorationLine: 'underline' }}>Политикой конфиденциальности</Text>
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

function PhoneStage({
  theme,
  phoneLocal,
  onPhoneChange,
  onSubmit,
  busy,
  error,
  phoneValid,
  onGoogle,
  googleBusy,
  googleDisabled,
}: {
  theme: ReturnType<typeof useTheme>;
  phoneLocal: string;
  onPhoneChange: (v: string) => void;
  onSubmit: () => void;
  busy: boolean;
  error: string | null;
  phoneValid: boolean;
  onGoogle: () => void;
  googleBusy: boolean;
  googleDisabled: boolean;
}) {
  const t = theme;
  return (
    <View style={{ gap: t.space[5] }}>
      <View
        style={{
          backgroundColor: t.color.bg.surface,
          borderColor: t.color.line.hairline,
          borderWidth: 1,
          borderRadius: t.radius.lg,
          padding: t.space[6],
          gap: t.space[4],
        }}
      >
        <Text
          style={{
            color: t.color.ink.primary,
            fontSize: t.type.titleMd.fontSize,
            lineHeight: t.type.titleMd.lineHeight,
            fontWeight: t.type.titleMd.fontWeight,
          }}
        >
          Добро пожаловать
        </Text>
        <Text
          style={{
            color: t.color.ink.secondary,
            fontSize: t.type.bodyMd.fontSize,
            lineHeight: t.type.bodyMd.lineHeight,
          }}
        >
          Введите номер телефона, чтобы войти или зарегистрироваться
        </Text>
        <PhoneInput theme={t} value={phoneLocal} onChange={onPhoneChange} />
        {error && <ErrorText>{error}</ErrorText>}
      </View>
      <Button onPress={onSubmit} disabled={busy || !phoneValid}>
        {busy ? 'Отправка кода...' : 'Получить код'}
      </Button>

      {/* Divider */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.space[3] }}>
        <View style={{ flex: 1, height: 1, backgroundColor: t.color.line.hairline }} />
        <Text style={{ color: t.color.ink.tertiary, fontSize: t.type.labelSm.fontSize }}>или</Text>
        <View style={{ flex: 1, height: 1, backgroundColor: t.color.line.hairline }} />
      </View>

      {/* Google sign-in */}
      <Pressable
        onPress={onGoogle}
        disabled={googleBusy || googleDisabled}
        style={({ pressed }) => ({
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: t.space[3],
          height: 56,
          borderRadius: t.radius.md,
          borderWidth: 1,
          borderColor: t.color.line.hairline,
          backgroundColor: t.color.bg.surface,
          opacity: googleBusy || googleDisabled ? 0.6 : pressed ? 0.9 : 1,
        })}
      >
        <Text style={{ color: '#4285F4', fontSize: 20, fontWeight: '800' }}>G</Text>
        <Text
          style={{
            color: t.color.ink.primary,
            fontSize: t.type.labelLg.fontSize,
            lineHeight: t.type.labelLg.lineHeight,
            fontWeight: t.type.labelLg.fontWeight,
          }}
        >
          {googleBusy ? 'Вход через Google...' : 'Войти через Google'}
        </Text>
      </Pressable>
    </View>
  );
}

function PhoneInput({
  theme,
  value,
  onChange,
}: {
  theme: ReturnType<typeof useTheme>;
  value: string;
  onChange: (v: string) => void;
}) {
  const t = theme;
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        height: 56,
        borderRadius: t.radius.md,
        borderWidth: 2,
        borderColor: t.color.line.hairline,
        backgroundColor: t.color.bg.surface,
        paddingHorizontal: t.space[4],
        gap: t.space[3],
      }}
    >
      <Text
        style={{
          color: t.color.ink.secondary,
          fontSize: t.type.titleSm.fontSize,
          lineHeight: t.type.titleSm.lineHeight,
          fontWeight: t.type.titleSm.fontWeight,
        }}
      >
        +7
      </Text>
      <View style={{ width: 1, height: 18, backgroundColor: t.color.line.hairline }} />
      <TextInput
        value={value}
        onChangeText={onChange}
        keyboardType="phone-pad"
        maxLength={10}
        placeholder="701 234 56 78"
        placeholderTextColor={t.color.ink.tertiary}
        style={{
          flex: 1,
          color: t.color.ink.primary,
          fontSize: t.type.titleSm.fontSize,
          lineHeight: t.type.titleSm.lineHeight,
          fontWeight: t.type.titleSm.fontWeight,
          padding: 0,
        }}
      />
    </View>
  );
}

function OtpStage({
  theme,
  displayPhone,
  otp,
  otpRefs,
  onDigit,
  onKey,
  name,
  onNameChange,
  onSubmit,
  onBack,
  onResend,
  busy,
  error,
  resendIn,
}: {
  theme: ReturnType<typeof useTheme>;
  displayPhone: string;
  otp: string[];
  otpRefs: React.MutableRefObject<Array<TextInput | null>>;
  onDigit: (i: number, v: string) => void;
  onKey: (i: number, k: string) => void;
  name: string;
  onNameChange: (v: string) => void;
  onSubmit: () => void;
  onBack: () => void;
  onResend: () => void;
  busy: boolean;
  error: string | null;
  resendIn: number;
}) {
  const t = theme;
  const codeReady = otp.every((d) => d !== '');
  return (
    <View style={{ gap: t.space[5] }}>
      <View
        style={{
          backgroundColor: t.color.bg.surface,
          borderColor: t.color.line.hairline,
          borderWidth: 1,
          borderRadius: t.radius.lg,
          padding: t.space[6],
          gap: t.space[4],
        }}
      >
        <Pressable
          onPress={onBack}
          hitSlop={8}
          style={{ alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: t.space[1] }}
        >
          <Text style={{ color: t.color.brand[500], fontSize: 18, lineHeight: 20 }}>←</Text>
          <Text
            style={{
              color: t.color.brand[500],
              fontSize: t.type.labelLg.fontSize,
              lineHeight: t.type.labelLg.lineHeight,
              fontWeight: t.type.labelLg.fontWeight,
            }}
          >
            Назад
          </Text>
        </Pressable>
        <View style={{ gap: t.space[2] }}>
          <Text
            style={{
              color: t.color.ink.primary,
              fontSize: t.type.titleMd.fontSize,
              lineHeight: t.type.titleMd.lineHeight,
              fontWeight: t.type.titleMd.fontWeight,
            }}
          >
            Подтверждение
          </Text>
          <Text
            style={{
              color: t.color.ink.secondary,
              fontSize: t.type.bodyMd.fontSize,
              lineHeight: t.type.bodyMd.lineHeight,
            }}
          >
            Мы отправили SMS с кодом на{' '}
            <Text style={{ color: t.color.ink.primary, fontWeight: '600' }}>{displayPhone}</Text>
          </Text>
        </View>

        {/* OTP boxes */}
        <View style={{ flexDirection: 'row', gap: t.space[2], justifyContent: 'space-between' }}>
          {otp.map((digit, i) => (
            <TextInput
              key={i}
              ref={(node) => {
                otpRefs.current[i] = node;
              }}
              value={digit}
              onChangeText={(v) => onDigit(i, v)}
              onKeyPress={({ nativeEvent }) => onKey(i, nativeEvent.key)}
              keyboardType="number-pad"
              maxLength={1}
              selectTextOnFocus
              textAlign="center"
              style={{
                flex: 1,
                height: 56,
                borderRadius: t.radius.md,
                borderWidth: 2,
                borderColor: digit ? t.color.brand[500] : t.color.line.hairline,
                backgroundColor: t.color.bg.surface,
                color: t.color.ink.primary,
                fontSize: t.type.titleLg.fontSize,
                lineHeight: t.type.titleLg.lineHeight,
                fontWeight: '700',
                fontVariant: ['tabular-nums'],
              }}
            />
          ))}
        </View>

        {/* Optional name (for new users) */}
        <View style={{ gap: t.space[2] }}>
          <Text
            style={{
              color: t.color.ink.secondary,
              fontSize: t.type.labelSm.fontSize,
              lineHeight: t.type.labelSm.lineHeight,
              fontWeight: t.type.labelSm.fontWeight,
              textTransform: 'uppercase',
              letterSpacing: 0.4,
            }}
          >
            Имя (для новых пользователей)
          </Text>
          <TextInput
            value={name}
            onChangeText={onNameChange}
            placeholder="Как к вам обращаться"
            placeholderTextColor={t.color.ink.tertiary}
            style={{
              backgroundColor: t.color.bg.surface,
              borderColor: t.color.line.hairline,
              borderRadius: t.radius.sm,
              borderWidth: 1,
              color: t.color.ink.primary,
              fontSize: t.type.bodyLg.fontSize,
              lineHeight: t.type.bodyLg.lineHeight,
              minHeight: 56,
              paddingHorizontal: t.space[4],
            }}
          />
        </View>

        {/* Resend timer */}
        <Pressable
          onPress={onResend}
          disabled={resendIn > 0 || busy}
          style={{ alignSelf: 'center' }}
          hitSlop={8}
        >
          <Text
            style={{
              color: resendIn > 0 ? t.color.ink.tertiary : t.color.brand[500],
              fontSize: t.type.labelSm.fontSize,
              lineHeight: t.type.labelSm.lineHeight,
              fontWeight: t.type.labelSm.fontWeight,
            }}
          >
            {resendIn > 0 ? `Отправить код повторно через ${resendIn}с` : 'Отправить код повторно'}
          </Text>
        </Pressable>

        {error && <ErrorText>{error}</ErrorText>}
      </View>

      <Button onPress={onSubmit} disabled={busy || !codeReady}>
        {busy ? 'Входим...' : 'Войти'}
      </Button>
    </View>
  );
}
