import * as Network from 'expo-network';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { AppState, type AppStateStatus } from 'react-native';

import { countFailedOutbox, countPendingOutbox, processOutboxSync, resetFailedToPending } from '@/lib/outbox';

export type SyncStatus = 'idle' | 'offline' | 'syncing' | 'error';

type SyncContextValue = {
  status: SyncStatus;
  pending: number;
  failed: number;
  lastMessage: string | null;
  refreshCounts: () => void;
  runSyncNow: () => Promise<void>;
  retryFailed: () => void;
};

const SyncContext = createContext<SyncContextValue | null>(null);

export function SyncProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<SyncStatus>('idle');
  const [pending, setPending] = useState(0);
  const [failed, setFailed] = useState(0);
  const [lastMessage, setLastMessage] = useState<string | null>(null);

  const refreshCounts = useCallback(() => {
    setPending(countPendingOutbox());
    setFailed(countFailedOutbox());
  }, []);

  const runSyncNow = useCallback(async () => {
    const net = await Network.getNetworkStateAsync();
    const offline = net.isConnected === false || net.type === Network.NetworkStateType.NONE;
    if (offline) {
      setStatus('offline');
      setLastMessage('Sem conexão — eventos ficam na fila.');
      refreshCounts();
      return;
    }
    setStatus('syncing');
    const { synced, error } = await processOutboxSync();
    refreshCounts();
    if (error) {
      setStatus('error');
      setLastMessage(error);
    } else {
      setStatus('idle');
      setLastMessage(synced ? `${synced} evento(s) sincronizado(s).` : 'Fila vazia.');
    }
  }, [refreshCounts]);

  const retryFailed = useCallback(() => {
    resetFailedToPending();
    refreshCounts();
    void runSyncNow();
  }, [refreshCounts, runSyncNow]);

  useEffect(() => {
    refreshCounts();
    const interval = setInterval(() => {
      void runSyncNow();
    }, 90_000);
    return () => clearInterval(interval);
  }, [refreshCounts, runSyncNow]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (s: AppStateStatus) => {
      if (s === 'active') {
        refreshCounts();
        void runSyncNow();
      }
    });
    return () => sub.remove();
  }, [refreshCounts, runSyncNow]);

  const value = useMemo(
    () => ({ status, pending, failed, lastMessage, refreshCounts, runSyncNow, retryFailed }),
    [status, pending, failed, lastMessage, refreshCounts, runSyncNow, retryFailed],
  );

  return <SyncContext.Provider value={value}>{children}</SyncContext.Provider>;
}

export function useSync() {
  const ctx = useContext(SyncContext);
  if (!ctx) throw new Error('useSync must be inside SyncProvider');
  return ctx;
}
