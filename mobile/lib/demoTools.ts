import { isApiEnabled } from '@/lib/apiConfig';

/** Ferramentas de demo (simular GPS, +1 missão) — só em dev e sem API de produção. */
export function isDemoToolsEnabled(): boolean {
  if (isApiEnabled()) return false;
  if (typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_ENV === 'production') return false;
  return __DEV__;
}
