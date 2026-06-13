import { useCallback, useEffect, useRef, useState } from 'react';

type DraftStorage<T> = {
  load: (scopeKey: string) => Promise<T | null>;
  save: (scopeKey: string, data: T) => Promise<void>;
  clear: (scopeKey: string) => Promise<void>;
};

/**
 * Carrega rascunho ao montar e salva com debounce quando `data` muda.
 * `scopeKey` deve ser estável (empresa / stopId / 'global').
 */
export function useCommercialDraft<T extends object>(
  storage: DraftStorage<T>,
  scopeKey: string,
  data: T,
  options?: { debounceMs?: number; enabled?: boolean },
) {
  const debounceMs = options?.debounceMs ?? 500;
  const enabled = options?.enabled ?? true;
  const [ready, setReady] = useState(false);
  const dataRef = useRef(data);
  dataRef.current = data;

  useEffect(() => {
    let cancelled = false;
    setReady(false);
    void storage.load(scopeKey).then((draft) => {
      if (cancelled || !draft) {
        if (!cancelled) setReady(true);
        return;
      }
      // Caller should merge draft via onLoaded callback pattern — we only signal load happened
      void draft;
      if (!cancelled) setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, [scopeKey, storage]);

  const persist = useCallback(
    async (payload: T) => {
      if (!enabled) return;
      await storage.save(scopeKey, payload);
    },
    [enabled, scopeKey, storage],
  );

  useEffect(() => {
    if (!enabled || !ready) return;
    const tmr = setTimeout(() => {
      void persist(dataRef.current);
    }, debounceMs);
    return () => clearTimeout(tmr);
  }, [data, debounceMs, enabled, ready, persist]);

  const clearDraft = useCallback(async () => {
    await storage.clear(scopeKey);
  }, [scopeKey, storage]);

  return { ready, clearDraft, persistNow: persist };
}

/** Versão com callback de carga inicial para popular estado do formulário. */
export function useCommercialDraftWithLoad<T extends object>(
  storage: DraftStorage<T>,
  scopeKey: string,
  data: T,
  onLoaded: (draft: T) => void,
  options?: { debounceMs?: number; enabled?: boolean },
) {
  const debounceMs = options?.debounceMs ?? 500;
  const enabled = options?.enabled ?? true;
  const [ready, setReady] = useState(false);
  const loadedScopeRef = useRef<string | null>(null);
  const dataRef = useRef(data);
  dataRef.current = data;

  useEffect(() => {
    if (loadedScopeRef.current === scopeKey) return;
    let cancelled = false;
    setReady(false);
    void storage.load(scopeKey).then((draft) => {
      if (cancelled) return;
      loadedScopeRef.current = scopeKey;
      if (draft) onLoaded(draft);
      setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, [scopeKey, storage, onLoaded]);

  const persist = useCallback(
    async (payload: T) => {
      if (!enabled) return;
      await storage.save(scopeKey, payload);
    },
    [enabled, scopeKey, storage],
  );

  useEffect(() => {
    if (!enabled || !ready) return;
    const tmr = setTimeout(() => {
      void persist(dataRef.current);
    }, debounceMs);
    return () => clearTimeout(tmr);
  }, [data, debounceMs, enabled, ready, persist]);

  const clearDraft = useCallback(async () => {
    await storage.clear(scopeKey);
    loadedScopeRef.current = null;
  }, [scopeKey, storage]);

  return { ready, clearDraft };
}
