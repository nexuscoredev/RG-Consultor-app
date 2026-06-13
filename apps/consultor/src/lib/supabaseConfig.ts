export function getSupabaseUrl(): string {
  return (import.meta.env.VITE_SUPABASE_URL ?? '').trim().replace(/\/$/, '');
}

export function getSupabaseAnonKey(): string {
  return (import.meta.env.VITE_SUPABASE_ANON_KEY ?? '').trim();
}

export function isSupabaseConfigured(): boolean {
  return Boolean(getSupabaseUrl() && getSupabaseAnonKey());
}

/** Login via Supabase Auth (produção Vercel). */
export function isSupabaseAuthEnabled(): boolean {
  const provider = (import.meta.env.VITE_AUTH_PROVIDER ?? '').trim().toLowerCase();
  if (provider === 'supabase') return isSupabaseConfigured();
  if (provider === 'api' || provider === 'mock') return false;
  // Auto: Supabase quando URL + key existem em build de produção
  return isSupabaseConfigured() && import.meta.env.PROD;
}
