import AsyncStorage from '@react-native-async-storage/async-storage';
import { authApiMe, authApiSignIn, type AuthUserProfile } from '@/lib/authApi';
import { isAuthApiEnabled } from '@/lib/apiConfig';
import { setApiTokenProvider } from '@/lib/api';
import { setOutboxTokenProvider } from '@/lib/outbox';
import { authTokenDelete, authTokenGet, authTokenSet } from '@/lib/authTokenStorage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const TOKEN_KEY = 'rg_auth_token';
const CONSENT_KEY = 'rg_consent_v1';
const PROFILE_KEY = 'rg_profile_v1';

export type ConsentSnapshot = {
  locationWhenInUse: boolean;
  locationBackground: boolean;
  dataRetentionAck: boolean;
};

export type UserRole = 'seller' | 'master';

export type UserProfile = {
  email: string;
  role: UserRole;
  displayName: string;
  region: string;
  sellerId: string;
};

type AuthContextValue = {
  ready: boolean;
  token: string | null;
  profile: UserProfile | null;
  consent: ConsentSnapshot | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  saveConsent: (c: ConsentSnapshot) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function inferRole(email: string): UserRole {
  const e = email.trim().toLowerCase();
  if (e.startsWith('master@') || e.startsWith('admin@')) return 'master';
  return 'seller';
}

function displayFromEmail(email: string): string {
  const local = email.split('@')[0] ?? 'consultor';
  return local.replace(/[._]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function profileFromApiUser(u: AuthUserProfile): UserProfile {
  return {
    email: u.email,
    role: u.role,
    displayName: u.displayName,
    region: u.region,
    sellerId: u.sellerId,
  };
}

/** Recupera perfil a partir do JWT demo legado (`demo.<email-encoded>.<ts>`). */
function profileFromToken(token: string): UserProfile | null {
  const parts = token.split('.');
  const enc = parts[1];
  if (!enc) return null;
  try {
    const email = decodeURIComponent(enc);
    if (!email.includes('@')) return null;
    const role = inferRole(email);
    return {
      email,
      role,
      displayName: displayFromEmail(email),
      region: role === 'master' ? 'Brasil' : 'SP — Capital',
      sellerId: role === 'master' ? 'master-1' : `seller-${encodeURIComponent(email).slice(0, 24)}`,
    };
  } catch {
    return null;
  }
}

async function resolveProfile(token: string, fallbackEmail?: string): Promise<UserProfile | null> {
  if (isAuthApiEnabled()) {
    const fromApi = await authApiMe(token);
    if (fromApi) return profileFromApiUser(fromApi);
  }
  const fromDemo = profileFromToken(token);
  if (fromDemo) return fromDemo;
  if (fallbackEmail) {
    const role = inferRole(fallbackEmail);
    return {
      email: fallbackEmail,
      role,
      displayName: displayFromEmail(fallbackEmail),
      region: role === 'master' ? 'Brasil' : 'SP — Capital',
      sellerId: role === 'master' ? 'master-1' : `seller-${encodeURIComponent(fallbackEmail).slice(0, 24)}`,
    };
  }
  return null;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [consent, setConsent] = useState<ConsentSnapshot | null>(null);

  useEffect(() => {
    setApiTokenProvider(() => token);
    setOutboxTokenProvider(() => token);
  }, [token]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [t, c, p] = await Promise.all([
          authTokenGet(TOKEN_KEY),
          AsyncStorage.getItem(CONSENT_KEY),
          AsyncStorage.getItem(PROFILE_KEY),
        ]);
        if (cancelled) return;
        setToken(t);
        setConsent(c ? (JSON.parse(c) as ConsentSnapshot) : null);
        let prof = p ? (JSON.parse(p) as UserProfile) : null;
        if (t) {
          const resolved = await resolveProfile(t, prof?.email);
          if (resolved) {
            prof = resolved;
            await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(prof));
          }
        }
        setProfile(prof);
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const { accessToken, email: resolvedEmail } = await authApiSignIn(email, password);
    const prof = (await resolveProfile(accessToken, resolvedEmail)) ?? {
      email: resolvedEmail,
      role: inferRole(resolvedEmail),
      displayName: displayFromEmail(resolvedEmail),
      region: inferRole(resolvedEmail) === 'master' ? 'Brasil' : 'SP — Capital',
      sellerId:
        inferRole(resolvedEmail) === 'master'
          ? 'master-1'
          : `seller-${encodeURIComponent(resolvedEmail).slice(0, 24)}`,
    };
    await authTokenSet(TOKEN_KEY, accessToken);
    await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(prof));
    setToken(accessToken);
    setProfile(prof);
  }, []);

  const signOut = useCallback(async () => {
    await authTokenDelete(TOKEN_KEY);
    await AsyncStorage.removeItem(PROFILE_KEY);
    setToken(null);
    setProfile(null);
  }, []);

  const saveConsent = useCallback(async (c: ConsentSnapshot) => {
    await AsyncStorage.setItem(CONSENT_KEY, JSON.stringify(c));
    setConsent(c);
  }, []);

  const value = useMemo(
    () => ({ ready, token, profile, consent, signIn, signOut, saveConsent }),
    [ready, token, profile, consent, signIn, signOut, saveConsent],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
}
