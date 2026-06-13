import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { authMe, authSignIn, authSignOutRemote, type AuthUserProfile } from '@/lib/auth';
import { setApiTokenProvider } from '@/lib/api';
import { getSupabase } from '@/lib/supabase';
import { isSupabaseAuthEnabled } from '@/lib/supabaseConfig';
import { getStoredToken, setStoredToken } from '@/lib/storage';

type AuthState = {
  token: string | null;
  user: AuthUserProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => void;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => getStoredToken());
  const [user, setUser] = useState<AuthUserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setApiTokenProvider(() => token);
  }, [token]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (isSupabaseAuthEnabled()) {
        const { data } = await getSupabase().auth.getSession();
        const session = data.session;
        if (cancelled) return;
        if (session?.access_token) {
          setToken(session.access_token);
          setStoredToken(session.access_token);
          const profile = await authMe(session.access_token);
          if (!cancelled && profile) setUser(profile);
        } else {
          setToken(null);
          setStoredToken(null);
          setUser(null);
        }
        setLoading(false);
        return;
      }

      const stored = getStoredToken();
      if (!stored) {
        if (!cancelled) {
          setUser(null);
          setLoading(false);
        }
        return;
      }

      const profile = await authMe(stored);
      if (cancelled) return;
      if (profile) {
        setUser(profile);
        setToken(stored);
      } else if (!stored.startsWith('demo.')) {
        setToken(null);
        setStoredToken(null);
        setUser(null);
      } else {
        setToken(stored);
        setUser({
          email: decodeURIComponent(stored.split('.')[1] ?? 'demo'),
          role: 'seller',
          displayName: 'Consultor Demo',
          sellerId: '22222222-2222-2222-2222-222222222222',
          region: 'SP',
        });
      }
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!isSupabaseAuthEnabled()) return;
    const { data } = getSupabase().auth.onAuthStateChange((_event, session) => {
      if (session?.access_token) {
        setToken(session.access_token);
        setStoredToken(session.access_token);
        authMe(session.access_token).then((p) => p && setUser(p));
      } else {
        setToken(null);
        setStoredToken(null);
        setUser(null);
      }
    });
    return () => data.subscription.unsubscribe();
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const result = await authSignIn(email, password);
    setStoredToken(result.accessToken);
    setToken(result.accessToken);
    setUser(
      result.user ?? {
        email: result.email,
        role: 'seller',
        displayName: 'Consultor',
        sellerId: '22222222-2222-2222-2222-222222222222',
        region: 'SP',
      },
    );
  }, []);

  const signOut = useCallback(() => {
    void authSignOutRemote();
    setStoredToken(null);
    setToken(null);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ token, user, loading, signIn, signOut }),
    [token, user, loading, signIn, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth outside AuthProvider');
  return ctx;
}
