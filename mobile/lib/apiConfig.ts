import Constants from 'expo-constants';

export type ApiMode = 'mock' | 'api';

type Extra = {
  apiMode?: ApiMode;
  apiBaseUrl?: string;
  authMode?: ApiMode;
  authApiBaseUrl?: string;
};

function readExtra(): Extra {
  return (Constants.expoConfig?.extra ?? {}) as Extra;
}

/** URL base da API (sem barra final). Prioridade: EXPO_PUBLIC_API_BASE_URL → extra.apiBaseUrl → extra.authApiBaseUrl */
export function getApiBaseUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_API_BASE_URL?.trim();
  if (fromEnv) return fromEnv.replace(/\/$/, '');
  const extra = readExtra();
  const fromExtra = extra.apiBaseUrl?.trim() || extra.authApiBaseUrl?.trim();
  return fromExtra ? fromExtra.replace(/\/$/, '') : '';
}

export function getApiMode(): ApiMode {
  const envMode = process.env.EXPO_PUBLIC_API_MODE?.trim();
  if (envMode === 'api' || envMode === 'mock') return envMode;
  const extra = readExtra();
  if (extra.apiMode === 'api' || extra.apiMode === 'mock') return extra.apiMode;
  if (extra.authMode === 'api') return 'api';
  return 'mock';
}

/** API real activa quando modo `api` e URL configurada. */
export function isApiEnabled(): boolean {
  return getApiMode() === 'api' && getApiBaseUrl().length > 0;
}

export function isAuthApiEnabled(): boolean {
  const extra = readExtra();
  const authMode = extra.authMode ?? getApiMode();
  if (authMode !== 'api') return false;
  return getApiBaseUrl().length > 0;
}

/** Avisos de configuração (ex.: API sem auth). */
export function getApiConfigWarnings(): string[] {
  const warnings: string[] = [];
  const apiOn = getApiMode() === 'api' && getApiBaseUrl().length > 0;
  const authOn = isAuthApiEnabled();
  if (apiOn && !authOn) {
    warnings.push('API activa sem AUTH_MODE=api — a sincronização pode falhar.');
  }
  if (getApiMode() === 'api' && !getApiBaseUrl()) {
    warnings.push('API_MODE=api sem URL — configure EXPO_PUBLIC_API_BASE_URL.');
  }
  return warnings;
}
