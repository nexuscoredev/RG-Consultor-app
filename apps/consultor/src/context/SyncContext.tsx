import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { useAuth } from '@/context/AuthContext';
import { isApiEnabled } from '@/lib/apiConfig';
import {
  countFailedOutbox,
  countPendingOutbox,
  processOutboxSync,
  resetFailedToPending,
  setOutboxTokenProvider,
} from '@/lib/outbox';

type SyncState = {
  pending: number;
  failed: number;
  syncing: boolean;
  lastSyncAt: number | null;
  lastError: string | null;
  syncNow: () => Promise<void>;
  retryFailed: () => Promise<void>;
};

const SyncContext = createContext<SyncState | null>(null);

export function SyncProvider({ children }: { children: ReactNode }) {
  const { token } = useAuth();
  const [pending, setPending] = useState(0);
  const [failed, setFailed] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const [lastSyncAt, setLastSyncAt] = useState<number | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);

  useEffect(() => {
    setOutboxTokenProvider(() => token);
  }, [token]);

  const refreshCounts = useCallback(() => {
    setPending(countPendingOutbox());
    setFailed(countFailedOutbox());
  }, []);

  const syncNow = useCallback(async () => {
    if (!isApiEnabled() || !token) {
      setLastError('api_offline');
      refreshCounts();
      return;
    }
    setSyncing(true);
    try {
      const result = await processOutboxSync();
      if (result.synced > 0) {
        setLastSyncAt(Date.now());
        setLastError(null);
      } else if (result.error && result.error !== 'api_offline') {
        setLastError(result.error);
      }
    } catch (e) {
      setLastError(e instanceof Error ? e.message : 'sync_error');
    } finally {
      setSyncing(false);
      refreshCounts();
    }
  }, [token, refreshCounts]);

  const retryFailed = useCallback(async () => {
    resetFailedToPending();
    refreshCounts();
    await syncNow();
  }, [syncNow, refreshCounts]);

  useEffect(() => {
    refreshCounts();
    const interval = window.setInterval(() => {
      if (countPendingOutbox() > 0 && isApiEnabled() && token) {
        syncNow();
      }
    }, 45_000);
    return () => window.clearInterval(interval);
  }, [refreshCounts, syncNow, token]);

  useEffect(() => {
    if (token && isApiEnabled() && countPendingOutbox() > 0) {
      syncNow();
    }
  }, [token, syncNow]);

  const value = useMemo(
    () => ({ pending, failed, syncing, lastSyncAt, lastError, syncNow, retryFailed }),
    [pending, failed, syncing, lastSyncAt, lastError, syncNow, retryFailed],
  );

  return <SyncContext.Provider value={value}>{children}</SyncContext.Provider>;
}

export function useSync(): SyncState {
  const ctx = useContext(SyncContext);
  if (!ctx) throw new Error('useSync outside SyncProvider');
  return ctx;
}
