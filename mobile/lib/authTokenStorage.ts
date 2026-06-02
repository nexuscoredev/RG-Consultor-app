import { Platform } from 'react-native';

/**
 * Token de sessão: SecureStore em nativo; na web o módulo secure-store não é fiável,
 * por isso usamos `localStorage` (adequado para preview / dev web).
 */
export async function authTokenGet(key: string): Promise<string | null> {
  if (Platform.OS === 'web') {
    try {
      if (typeof globalThis !== 'undefined' && 'localStorage' in globalThis && globalThis.localStorage) {
        return globalThis.localStorage.getItem(key);
      }
    } catch {
      /* private mode / bloqueio */
    }
    return null;
  }
  const SecureStore = require('expo-secure-store') as typeof import('expo-secure-store');
  return SecureStore.getItemAsync(key);
}

export async function authTokenSet(key: string, value: string): Promise<void> {
  if (Platform.OS === 'web') {
    try {
      globalThis.localStorage?.setItem(key, value);
    } catch {
      /* ignore */
    }
    return;
  }
  const SecureStore = require('expo-secure-store') as typeof import('expo-secure-store');
  await SecureStore.setItemAsync(key, value);
}

export async function authTokenDelete(key: string): Promise<void> {
  if (Platform.OS === 'web') {
    try {
      globalThis.localStorage?.removeItem(key);
    } catch {
      /* ignore */
    }
    return;
  }
  const SecureStore = require('expo-secure-store') as typeof import('expo-secure-store');
  await SecureStore.deleteItemAsync(key);
}
