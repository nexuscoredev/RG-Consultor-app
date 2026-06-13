import { RgLogo } from '@/components/RgLogo';

export function AppLoadingScreen() {
  return (
    <div className="app-loading">
      <RgLogo variant="wordmark" subtitle="Carregando sistema…" />
      <span className="app-loading__spinner" aria-hidden />
    </div>
  );
}
