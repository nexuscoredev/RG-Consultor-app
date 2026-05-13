import Constants from 'expo-constants';

export type AuthSignInResult = {
  accessToken: string;
  email: string;
};

type Extra = {
  authMode?: 'mock' | 'api';
  authApiBaseUrl?: string;
  environment?: string;
  showDemoAuth?: boolean;
};

function extra(): Extra {
  return (Constants.expoConfig?.extra ?? {}) as Extra;
}

/**
 * Login: modo `mock` (padrão) ou `api` quando `authApiBaseUrl` + `authMode: api` em app.json / EAS.
 * Corpo esperado em produção: POST JSON { email, password } → { access_token }.
 */
export async function authApiSignIn(email: string, password: string): Promise<AuthSignInResult> {
  const trimmed = email.trim();
  if (!trimmed || !password) {
    throw new Error('Informe e-mail e senha.');
  }

  const { authMode = 'mock', authApiBaseUrl } = extra();

  if (authMode === 'api') {
    const base = authApiBaseUrl?.replace(/\/$/, '');
    if (!base) {
      throw new Error('authApiBaseUrl não configurado em extra.');
    }
    const res = await fetch(`${base}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ email: trimmed, password }),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(text || `Login falhou (${res.status}).`);
    }
    const data = (await res.json()) as { access_token?: string; accessToken?: string };
    const accessToken = data.access_token ?? data.accessToken;
    if (!accessToken) throw new Error('Resposta sem token.');
    return { accessToken, email: trimmed };
  }

  await new Promise((r) => setTimeout(r, 120));
  return { accessToken: `demo.${encodeURIComponent(trimmed)}.${Date.now()}`, email: trimmed };
}

export function isDemoAuthVisible(): boolean {
  const e = extra();
  if (e.authMode === 'api') return false;
  if (typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_ENV === 'production') return false;
  if (e.environment === 'production' && !__DEV__) return false;
  if (e.showDemoAuth === false) return false;
  return true;
}
