import { AppIcon } from '@/components/AppIcon';
import { Button } from '@/components/Button';
import { useSync } from '@/context/SyncContext';
import { isApiEnabled } from '@/lib/apiConfig';

export function SyncBanner() {
  const { pending, failed, syncing, lastError, syncNow, retryFailed } = useSync();

  if (!isApiEnabled()) return null;
  if (pending === 0 && failed === 0 && !lastError) return null;

  const tone = failed > 0 ? 'warn' : 'info';

  return (
    <div className={`sync-banner sync-banner--${tone}`}>
      <AppIcon name={failed > 0 ? 'alert' : 'leaf'} size={18} />
      <div className="sync-banner__text">
        {syncing ? (
          <span>Sincronizando…</span>
        ) : failed > 0 ? (
          <span>{failed} evento(s) com falha · {pending} pendente(s)</span>
        ) : (
          <span>{pending} evento(s) aguardando sync</span>
        )}
        {lastError && lastError !== 'api_offline' ? (
          <span className="sync-banner__err">{lastError}</span>
        ) : null}
      </div>
      <div className="sync-banner__actions">
        {failed > 0 ? (
          <Button variant="ghost" onClick={() => retryFailed()}>
            Reenviar
          </Button>
        ) : null}
        <Button variant="secondary" onClick={() => syncNow()} disabled={syncing}>
          Sync
        </Button>
      </div>
    </div>
  );
}
