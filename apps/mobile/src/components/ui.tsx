import { useMemo } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { useTheme } from '@/lib/theme-provider';
import type { Theme } from '@/lib/tokens';

export function Screen({
  children,
  padded = true,
}: {
  children: React.ReactNode;
  padded?: boolean;
}) {
  const t = useTheme();
  return (
    <View
      style={[
        { flex: 1, backgroundColor: t.color.bg.page },
        padded && { padding: t.space[4] },
      ]}
    >
      {children}
    </View>
  );
}

export function Card({ children }: { children: React.ReactNode }) {
  const t = useTheme();
  return (
    <View
      style={{
        backgroundColor: t.color.bg.surface,
        borderColor: t.color.line.hairline,
        borderRadius: t.radius.md,
        borderWidth: 1,
        padding: t.space[4],
      }}
    >
      {children}
    </View>
  );
}

export function Title({ children }: { children: React.ReactNode }) {
  const t = useTheme();
  return (
    <Text
      style={{
        color: t.color.ink.primary,
        fontSize: t.type.titleLg.fontSize,
        lineHeight: t.type.titleLg.lineHeight,
        fontWeight: t.type.titleLg.fontWeight,
        marginBottom: t.space[2],
      }}
    >
      {children}
    </Text>
  );
}

export function Muted({ children }: { children: React.ReactNode }) {
  const t = useTheme();
  return (
    <Text
      style={{
        color: t.color.ink.secondary,
        fontSize: t.type.bodyMd.fontSize,
        lineHeight: t.type.bodyMd.lineHeight,
      }}
    >
      {children}
    </Text>
  );
}

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'lg' | 'md' | 'sm';

export function Button({
  children,
  onPress,
  disabled,
  variant = 'primary',
  size = 'lg',
}: {
  children: React.ReactNode;
  onPress?: () => void;
  disabled?: boolean;
  variant?: ButtonVariant;
  size?: ButtonSize;
}) {
  const t = useTheme();
  const sizing = useMemo<{ minHeight: number; px: number; radius: number }>(() => {
    if (size === 'sm') return { minHeight: 36, px: t.space[4], radius: t.radius.md };
    if (size === 'md') return { minHeight: 44, px: t.space[5], radius: t.radius.lg };
    return { minHeight: 52, px: t.space[6], radius: t.radius.lg };
  }, [size, t]);

  const palette = useMemo<{ bg: string; fg: string; border?: string }>(() => {
    switch (variant) {
      case 'secondary':
        return { bg: t.color.bg.surface, fg: t.color.brand[500], border: t.color.brand[500] };
      case 'ghost':
        return { bg: 'transparent', fg: t.color.brand[500] };
      case 'danger':
        return { bg: t.color.danger[500], fg: '#FFFFFF' };
      default:
        return { bg: t.color.brand[500], fg: t.color.ink.onBrand };
    }
  }, [variant, t]);

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        {
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: sizing.minHeight,
          paddingHorizontal: sizing.px,
          borderRadius: sizing.radius,
          backgroundColor: palette.bg,
          borderWidth: palette.border ? 1 : 0,
          borderColor: palette.border,
          opacity: disabled ? 0.4 : 1,
          transform: [{ scale: pressed && !disabled ? 0.97 : 1 }],
        },
        pressed && !disabled && variant === 'primary' && { backgroundColor: t.color.brand[600] },
      ]}
    >
      <Text
        style={{
          color: palette.fg,
          fontSize: t.type.labelLg.fontSize,
          lineHeight: t.type.labelLg.lineHeight,
          fontWeight: t.type.labelLg.fontWeight,
        }}
      >
        {children}
      </Text>
    </Pressable>
  );
}

export function Field({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  multiline,
  secureTextEntry,
}: {
  label: string;
} & Pick<
  TextInputProps,
  'value' | 'onChangeText' | 'placeholder' | 'keyboardType' | 'multiline' | 'secureTextEntry'
>) {
  const t = useTheme();
  return (
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
        {label}
      </Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        keyboardType={keyboardType}
        multiline={multiline}
        secureTextEntry={secureTextEntry}
        placeholderTextColor={t.color.ink.tertiary}
        style={[
          {
            backgroundColor: t.color.bg.surface,
            borderColor: t.color.line.hairline,
            borderRadius: t.radius.sm,
            borderWidth: 1,
            color: t.color.ink.primary,
            fontSize: t.type.bodyLg.fontSize,
            lineHeight: t.type.bodyLg.lineHeight,
            minHeight: 56,
            paddingHorizontal: t.space[4],
            paddingVertical: t.space[3],
          },
          multiline && { minHeight: 96, textAlignVertical: 'top' as TextStyle['textAlignVertical'] },
        ]}
      />
    </View>
  );
}

export function ErrorText({ children }: { children: React.ReactNode }) {
  const t = useTheme();
  if (!children) return null;
  return (
    <View
      style={{
        backgroundColor: t.color.danger[100],
        borderRadius: t.radius.sm,
        padding: t.space[3],
      }}
    >
      <Text
        style={{
          color: t.color.danger[500],
          fontSize: t.type.bodySm.fontSize,
          lineHeight: t.type.bodySm.lineHeight,
        }}
      >
        {children}
      </Text>
    </View>
  );
}

export function Chip({
  label,
  active,
  onPress,
}: {
  label: string;
  active?: boolean;
  onPress?: () => void;
}) {
  const t = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={{
        borderColor: active ? t.color.brand[500] : t.color.line.hairline,
        backgroundColor: active ? t.color.brand[100] : 'transparent',
        borderRadius: t.radius.pill,
        borderWidth: 1,
        paddingHorizontal: t.space[4],
        paddingVertical: t.space[2],
        minHeight: 32,
        justifyContent: 'center',
      }}
    >
      <Text
        style={{
          color: active ? t.color.brand[500] : t.color.ink.primary,
          fontSize: t.type.labelLg.fontSize,
          lineHeight: t.type.labelLg.lineHeight,
          fontWeight: t.type.labelLg.fontWeight,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

// PriceBlock — the hero number on the booking screen (Design.md §6.7).
// Tabular numerals so price ticks don't jitter.
export function PriceBlock({ amount, currency = '₸' }: { amount: number; currency?: string }) {
  const t = useTheme();
  const formatted = new Intl.NumberFormat('ru-RU').format(amount);
  return (
    <Text
      accessibilityLiveRegion="polite"
      style={{
        color: t.color.brand[500],
        fontSize: t.type.displayXl.fontSize,
        lineHeight: t.type.displayXl.lineHeight,
        fontWeight: t.type.displayXl.fontWeight,
        letterSpacing: t.type.displayXl.letterSpacing,
        fontVariant: ['tabular-nums'],
      }}
    >
      {currency} {formatted}
    </Text>
  );
}

// Status chip — Design.md §6.3 second role: brand/warn/danger soft fills.
export function StatusChip({
  label,
  tone = 'brand',
}: {
  label: string;
  tone?: 'brand' | 'warn' | 'danger';
}) {
  const t = useTheme();
  const palette = paletteForTone(t, tone);
  return (
    <View
      style={{
        backgroundColor: palette.bg,
        borderRadius: t.radius.pill,
        paddingHorizontal: t.space[3],
        paddingVertical: t.space[1],
        alignSelf: 'flex-start',
      }}
    >
      <Text
        style={{
          color: palette.fg,
          fontSize: t.type.labelSm.fontSize,
          lineHeight: t.type.labelSm.lineHeight,
          fontWeight: t.type.labelSm.fontWeight,
        }}
      >
        {label}
      </Text>
    </View>
  );
}

function paletteForTone(t: Theme, tone: 'brand' | 'warn' | 'danger') {
  if (tone === 'warn') return { bg: t.color.accent[100], fg: t.color.warn[500] };
  if (tone === 'danger') return { bg: t.color.danger[100], fg: t.color.danger[500] };
  return { bg: t.color.brand[100], fg: t.color.brand[500] };
}

// Sticky bottom action bar — Design.md §5.
export function BottomActionBar({ children }: { children: React.ReactNode }) {
  const t = useTheme();
  const barStyle: ViewStyle = {
    backgroundColor: t.color.bg.surface,
    borderTopColor: t.color.line.hairline,
    borderTopWidth: 1,
    paddingHorizontal: t.space[4],
    paddingTop: t.space[3],
    paddingBottom: t.space[4],
    ...t.elevation.bottomBar,
  };
  return <View style={barStyle}>{children}</View>;
}

// Compatibility: ui.tsx historically used StyleSheet — keep an empty sheet so any
// downstream `import { styles }` from this module would still typecheck. Not exported.
StyleSheet.create({});
