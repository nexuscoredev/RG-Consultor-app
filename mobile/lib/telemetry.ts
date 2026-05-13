import Constants from 'expo-constants';

/**
 * Telemetria / crashes. Não enviar e-mail nem payloads completos em produção.
 *
 * Para Sentry: instale `@sentry/react-native`, faça prebuild/build nativo e chame `Sentry.init`
 * aqui com `Constants.expoConfig?.extra?.sentryDsn` (não incluído por padrão para evitar
 * dependência nativa obrigatória no protótipo).
 */
export function initTelemetry(): void {
  const dsn = (Constants.expoConfig?.extra as { sentryDsn?: string } | undefined)?.sentryDsn;
  if (__DEV__ && dsn) {
    // eslint-disable-next-line no-console
    console.warn('[telemetry] sentryDsn definido — instale @sentry/react-native e chame Sentry.init em initTelemetry.');
  }
}

/** Evento analítico sem PII — só nomes de tela ou ações agregadas. */
export function logAppEvent(name: string, attrs?: Record<string, string | number | boolean>): void {
  if (__DEV__) {
    // eslint-disable-next-line no-console
    console.log('[telemetry]', name, attrs ?? {});
  }
}
