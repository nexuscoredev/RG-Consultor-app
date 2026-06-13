/** Dispara contagem e sync imediata após enqueue comercial (Sprint A). */
export function afterCommercialEnqueue(sync: {
  refreshCounts: () => void;
  runSyncNow: () => Promise<void>;
}): void {
  sync.refreshCounts();
  void sync.runSyncNow();
}
