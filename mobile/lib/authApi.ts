import { getApiBaseUrl, isAuthApiEnabled } from '@/lib/apiConfig';
import { apiFetch } from '@/lib/apiClient';

export type AuthSignInResult = {
  accessToken: string;
  email: string;
};

export type AuthUserProfile = {
  email: string;
  role: 'seller' | 'master';
  displayName: string;
  sellerId: string;
  region: string;
};

/**
 * Login: modo `mock` (padrão) ou `api` quando `apiMode`/`authMode: api` + URL configurada.
 * POST /auth/login { email, password } → { access_token, user }.
 */
export async function authApiSignIn(email: string, password: string): Promise<AuthSignInResult> {
  const trimmed = email.trim();
  if (!trimmed || !password) {
    throw new Error('Informe e-mail e senha.');
  }

  if (isAuthApiEnabled()) {
    const data = await apiFetch<{ access_token?: string; accessToken?: string; user?: AuthUserProfile }>(
      '/auth/login',
      {
        method: 'POST',
        body: { email: trimmed, password },
      },
    );
    const accessToken = data.access_token ?? data.accessToken;
    if (!accessToken) throw new Error('Resposta sem token.');
    return { accessToken, email: data.user?.email ?? trimmed };
  }

  await new Promise((r) => setTimeout(r, 120));
  return { accessToken: `demo.${encodeURIComponent(trimmed)}.${Date.now()}`, email: trimmed };
}

export async function authApiMe(token: string): Promise<AuthUserProfile | null> {
  if (!isAuthApiEnabled()) return null;
  try {
    const data = await apiFetch<{ user: AuthUserProfile }>('/auth/me', { token });
    return data.user;
  } catch {
    return null;
  }
}

export function isDemoAuthVisible(): boolean {
  if (isAuthApiEnabled()) return false;
  if (typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_ENV === 'production') return false;
  return true;
}

export function getAuthApiHint(): string {
  if (isAuthApiEnabled()) {
    return `API: ${getApiBaseUrl()} · vendedor@rg.com / rg2026`;
  }
  return 'Modo demonstração — e-mail e senha não vazios.';
}
