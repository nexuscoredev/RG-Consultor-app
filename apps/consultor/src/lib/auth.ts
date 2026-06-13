import { apiFetch } from './apiClient';
import { getApiBaseUrl, isAuthApiEnabled } from './apiConfig';
import { getSupabase } from './supabase';
import { isSupabaseAuthEnabled } from './supabaseConfig';

export type AuthUserProfile = {
  email: string;
  role: 'seller' | 'master';
  displayName: string;
  sellerId: string;
  region: string;
};

export type AuthSignInResult = {
  accessToken: string;
  email: string;
  user?: AuthUserProfile;
};

function profileFromMetadata(
  email: string,
  meta: Record<string, unknown> | undefined,
): AuthUserProfile {
  const role = meta?.role === 'master' ? 'master' : 'seller';
  return {
    email,
    role,
    displayName: String(meta?.display_name ?? meta?.displayName ?? 'Consultor RG'),
    sellerId: String(meta?.seller_id ?? meta?.sellerId ?? '22222222-2222-2222-2222-222222222222'),
    region: String(meta?.region ?? 'SP'),
  };
}

export async function authSignIn(email: string, password: string): Promise<AuthSignInResult> {
  const trimmed = email.trim().toLowerCase();
  if (!trimmed || !password) throw new Error('Informe e-mail e senha.');

  if (isSupabaseAuthEnabled()) {
    const { data, error } = await getSupabase().auth.signInWithPassword({
      email: trimmed,
      password,
    });
    if (error) throw new Error(error.message === 'Invalid login credentials' ? 'E-mail ou senha incorretos.' : error.message);
    const token = data.session?.access_token;
    if (!token) throw new Error('Resposta sem sessão.');
    const user = data.user;
    return {
      accessToken: token,
      email: user?.email ?? trimmed,
      user: profileFromMetadata(user?.email ?? trimmed, user?.user_metadata as Record<string, unknown>),
    };
  }

  if (isAuthApiEnabled()) {
    const data = await apiFetch<{
      access_token?: string;
      accessToken?: string;
      user?: AuthUserProfile;
    }>('/auth/login', {
      method: 'POST',
      body: { email: trimmed, password },
    });
    const accessToken = data.access_token ?? data.accessToken;
    if (!accessToken) throw new Error('Resposta sem token.');
    return { accessToken, email: data.user?.email ?? trimmed, user: data.user };
  }

  await new Promise((r) => setTimeout(r, 120));
  const role = trimmed.includes('master') ? 'master' : 'seller';
  return {
    accessToken: `demo.${encodeURIComponent(trimmed)}.${Date.now()}`,
    email: trimmed,
    user: {
      email: trimmed,
      role,
      displayName: role === 'master' ? 'Gestor Demo' : 'Consultor Demo',
      sellerId: '22222222-2222-2222-2222-222222222222',
      region: 'SP',
    },
  };
}

export async function authMe(token: string): Promise<AuthUserProfile | null> {
  if (isSupabaseAuthEnabled()) {
    try {
      const { data, error } = await getSupabase().auth.getUser(token);
      if (error || !data.user) return null;
      return profileFromMetadata(data.user.email ?? '', data.user.user_metadata as Record<string, unknown>);
    } catch {
      return null;
    }
  }

  if (!isAuthApiEnabled()) return null;
  try {
    const data = await apiFetch<{ user: AuthUserProfile }>('/auth/me', { token });
    return data.user;
  } catch {
    return null;
  }
}

export async function authSignOutRemote(): Promise<void> {
  if (isSupabaseAuthEnabled()) {
    await getSupabase().auth.signOut();
  }
}

export function authHint(): string {
  if (isSupabaseAuthEnabled()) return 'Login Supabase · use o e-mail cadastrado no projeto';
  if (isAuthApiEnabled()) return `API: ${getApiBaseUrl()} · vendedor@rg.com / rg2026`;
  return 'Modo demonstração — qualquer e-mail e senha.';
}
