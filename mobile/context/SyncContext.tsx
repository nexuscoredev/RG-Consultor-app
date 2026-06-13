import * as Network from 'expo-network';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AppState, type AppStateStatus } from 'react-native';

import { isApiEnabled } from '@/lib/apiConfig';
import { countFailedOutbox, countPendingOutbox, processOutboxSync, resetFailedToPending } from '@/lib/outbox';

export type SyncStatus = 'idle' | 'offline' | 'syncing' | 'error';

/** Sincronização periódica só com app em primeiro plano (economia de bateria). */
const SYNC_INTERVAL_MS = 120_000;

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
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

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
    refreshCounts();
    const pendingNow = countPendingOutbox();
    if (!isApiEnabled()) {
      setStatus('idle');
      setLastMessage(
        pendingNow > 0
          ? `${pendingNow} evento(s) salvos neste aparelho — aguardando servidor.`
          : null,
      );
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
      const stillPending = countPendingOutbox();
      setLastMessage(
        synced > 0
          ? `${synced} evento(s) sincronizado(s).`
          : stillPending > 0
            ? `${stillPending} evento(s) na fila.`
            : null,
      );
      if (synced > 0) {
        void import('@/lib/clientRegistry').then((m) => m.hydrateClientsFromApi());
      }
    }
  }, [refreshCounts]);

  const retryFailed = useCallback(() => {
    resetFailedToPending();
    refreshCounts();
    void runSyncNow();
  }, [refreshCounts, runSyncNow]);

  const stopPoll = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  const startPoll = useCallback(() => {
    if (pollRef.current) return;
    pollRef.current = setInterval(() => {
      if (AppState.currentState === 'active') void runSyncNow();
    }, SYNC_INTERVAL_MS);
  }, [runSyncNow]);

  useEffect(() => {
    refreshCounts();
    if (AppState.currentState === 'active') {
      void runSyncNow();
      startPoll();
    }

    const sub = AppState.addEventListener('change', (s: AppStateStatus) => {
      if (s === 'active') {
        refreshCounts();
        void runSyncNow();
        startPoll();
      } else {
        stopPoll();
      }
    });

    return () => {
      sub.remove();
      stopPoll();
    };
  }, [refreshCounts, runSyncNow, startPoll, stopPoll]);

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
