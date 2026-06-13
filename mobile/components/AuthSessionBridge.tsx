import { useAuth } from '@/context/AuthContext';
import { registerUnauthorizedHandler } from '@/lib/sessionAuth';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';

/** Liga 401 da API ao logout automático. */
export function AuthSessionBridge() {
  const { signOut } = useAuth();
  const router = useRouter();

  useEffect(() => {
    return registerUnauthorizedHandler(async () => {
      await signOut();
      router.replace('/login');
    });
  }, [router, signOut]);

  return null;
}
