/**
 * Android: não importar `react-native-maps` — o MapView nativo (Google) derruba o app
 * com chave ausente/errada, Fabric ou aninhamento em scroll. Sempre placeholder + link externo.
 */
import type { AgendaRouteMapProps } from './AgendaRouteMap.types';
import { AgendaMapPlaceholder } from './AgendaRouteMapPlaceholder';

export type { AgendaRouteMapProps } from './AgendaRouteMap.types';

export function AgendaRouteMap(props: AgendaRouteMapProps) {
  return <AgendaMapPlaceholder {...props} />;
}
