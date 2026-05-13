import { useContext } from 'react';
import { AppThemeContext } from '@/context/AppThemeContext';

/** Web: mesmo resolved scheme que mobile (Prefs + sistema). */
export function useColorScheme(): 'light' | 'dark' {
  const ctx = useContext(AppThemeContext);
  return ctx?.resolvedColorScheme ?? 'light';
}
