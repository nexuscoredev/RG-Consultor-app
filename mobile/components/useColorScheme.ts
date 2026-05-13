import { useContext } from 'react';
import { AppThemeContext } from '@/context/AppThemeContext';

/**
 * Esquema de cor resolvido (claro/escuro) conforme Configurações + sistema.
 * Substitui `useColorScheme` do React Native no app.
 */
export function useColorScheme(): 'light' | 'dark' {
  const ctx = useContext(AppThemeContext);
  return ctx?.resolvedColorScheme ?? 'light';
}
