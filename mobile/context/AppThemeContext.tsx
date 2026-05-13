import { usePrefs } from '@/context/PrefsContext';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Appearance, type ColorSchemeName } from 'react-native';

export type ResolvedColorScheme = 'light' | 'dark';

type AppThemeContextValue = {
  resolvedColorScheme: ResolvedColorScheme;
};

export const AppThemeContext = createContext<AppThemeContextValue | null>(null);

/**
 * Resolve tema a partir de Prefs (claro / escuro / sistema) + Appearance.
 */
export function AppThemeProvider({ children }: { children: React.ReactNode }) {
  const { prefs } = usePrefs();
  const [systemScheme, setSystemScheme] = useState<ColorSchemeName>(() => Appearance.getColorScheme());

  useEffect(() => {
    const sub = Appearance.addChangeListener(({ colorScheme }) => {
      setSystemScheme(colorScheme);
    });
    return () => sub.remove();
  }, []);

  const resolvedColorScheme = useMemo((): ResolvedColorScheme => {
    if (prefs.themePreference === 'light') return 'light';
    if (prefs.themePreference === 'dark') return 'dark';
    return systemScheme === 'dark' ? 'dark' : 'light';
  }, [prefs.themePreference, systemScheme]);

  const value = useMemo(() => ({ resolvedColorScheme }), [resolvedColorScheme]);

  return <AppThemeContext.Provider value={value}>{children}</AppThemeContext.Provider>;
}

export function useAppTheme(): AppThemeContextValue {
  const ctx = useContext(AppThemeContext);
  if (!ctx) throw new Error('useAppTheme must be used inside AppThemeProvider');
  return ctx;
}
