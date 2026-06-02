import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Appearance, type ColorSchemeName } from 'react-native';
import { buildTheme, type Theme } from '@/lib/tokens';

export type ThemePref = 'system' | 'light' | 'dark';

const STORAGE_KEY = 'shinex.themePref';

type Ctx = {
  theme: Theme;
  pref: ThemePref;
  setPref: (p: ThemePref) => void;
};

const ThemeContext = createContext<Ctx | null>(null);

function resolveScheme(pref: ThemePref, system: ColorSchemeName): 'light' | 'dark' {
  if (pref === 'light' || pref === 'dark') return pref;
  return system === 'dark' ? 'dark' : 'light';
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [pref, setPrefState] = useState<ThemePref>('light');
  const [system, setSystem] = useState<ColorSchemeName>(Appearance.getColorScheme() ?? 'light');

  useEffect(() => {
    let cancelled = false;
    AsyncStorage.getItem(STORAGE_KEY).then((v) => {
      if (!cancelled && (v === 'light' || v === 'dark' || v === 'system')) {
        setPrefState(v);
      }
    });
    const sub = Appearance.addChangeListener(({ colorScheme }) => setSystem(colorScheme));
    return () => {
      cancelled = true;
      sub.remove();
    };
  }, []);

  const setPref = (p: ThemePref) => {
    setPrefState(p);
    void AsyncStorage.setItem(STORAGE_KEY, p);
  };

  const value = useMemo<Ctx>(() => {
    const scheme = resolveScheme(pref, system);
    return { theme: buildTheme(scheme), pref, setPref };
  }, [pref, system]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): Theme {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside <ThemeProvider>');
  return ctx.theme;
}

export function useThemePref() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useThemePref must be used inside <ThemeProvider>');
  return { pref: ctx.pref, setPref: ctx.setPref };
}
