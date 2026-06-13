function pageHostname(): string | null {
  if (typeof window === 'undefined') return null;
  return window.location.hostname || null;
}

/** Quando o app abre pelo IP da rede (tablet), localhost no .env não funciona — usa o mesmo IP. */
function rewriteLocalApiHost(url: string): string {
  const host = pageHostname();
  if (!host || host === 'localhost' || host === '127.0.0.1') return url;
  return url.replace(/\/\/(localhost|127\.0\.0\.1)(?=[:/])/i, `//${host}`);
}

export function getApiBaseUrl(): string {
  const fromEnv = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '');
  if (fromEnv) return rewriteLocalApiHost(fromEnv);

  const host = pageHostname();
  if (host && host !== 'localhost' && host !== '127.0.0.1') {
    return `http://${host}:3001`;
  }
  return 'http://localhost:3001';
}

export function isApiEnabled(): boolean {
  return (import.meta.env.VITE_API_MODE ?? 'mock') === 'api';
}

export function isAuthApiEnabled(): boolean {
  return isApiEnabled();
}

import { isSupabaseAuthEnabled } from '@/lib/supabaseConfig';

export function apiConfigLabel(): string {
  if (isSupabaseAuthEnabled()) return 'Auth Supabase';
  if (isApiEnabled()) return `API · ${getApiBaseUrl()}`;
  return 'Modo demonstração';
}
