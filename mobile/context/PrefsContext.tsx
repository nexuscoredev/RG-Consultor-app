import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const PREFS_KEY = 'rg_prefs_v1';

export type ThemePreference = 'light' | 'dark' | 'system';

export type UserPrefs = {
  rankingOptIn: boolean;
  leaderboardAlias: string;
  themePreference: ThemePreference;
  /** Preferência para fluxo biométrico (teste / futuro desbloqueio). */
  biometricQuickLogin: boolean;
};

const defaultPrefs: UserPrefs = {
  rankingOptIn: false,
  leaderboardAlias: 'Você',
  themePreference: 'system',
  biometricQuickLogin: false,
};

type PrefsContextValue = {
  ready: boolean;
  prefs: UserPrefs;
  setPrefs: (p: Partial<UserPrefs>) => Promise<void>;
};

const PrefsContext = createContext<PrefsContextValue | null>(null);

function mergePrefs(raw: unknown): UserPrefs {
  if (!raw || typeof raw !== 'object') return { ...defaultPrefs };
  const o = raw as Record<string, unknown>;
  return {
    ...defaultPrefs,
    rankingOptIn: Boolean(o.rankingOptIn),
    leaderboardAlias: typeof o.leaderboardAlias === 'string' ? o.leaderboardAlias : defaultPrefs.leaderboardAlias,
    themePreference:
      o.themePreference === 'light' || o.themePreference === 'dark' || o.themePreference === 'system'
        ? o.themePreference
        : defaultPrefs.themePreference,
    biometricQuickLogin: Boolean(o.biometricQuickLogin),
  };
}

export function PrefsProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [prefs, setPrefsState] = useState<UserPrefs>(defaultPrefs);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(PREFS_KEY);
        if (cancelled) return;
        if (raw) setPrefsState(mergePrefs(JSON.parse(raw)));
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const setPrefs = useCallback(async (p: Partial<UserPrefs>) => {
    const next = { ...prefs, ...p };
    setPrefsState(next);
    await AsyncStorage.setItem(PREFS_KEY, JSON.stringify(next));
  }, [prefs]);

  const value = useMemo(() => ({ ready, prefs, setPrefs }), [ready, prefs, setPrefs]);

  return <PrefsContext.Provider value={value}>{children}</PrefsContext.Provider>;
}

export function usePrefs() {
  const ctx = useContext(PrefsContext);
  if (!ctx) throw new Error('usePrefs must be inside PrefsProvider');
  return ctx;
}
