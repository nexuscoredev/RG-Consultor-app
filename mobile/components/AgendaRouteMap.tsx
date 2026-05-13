/**
 * Tipagem compartilhada. O Metro resolve o componente em runtime:
 * - `AgendaRouteMap.android.tsx` — sem `react-native-maps` (evita crash na Agenda).
 * - `AgendaRouteMap.native.tsx` — iOS (MapKit).
 * - `AgendaRouteMap.web.tsx` — web.
 */
export type { AgendaRouteMapProps } from './AgendaRouteMap.types';
export { AgendaRouteMap } from './AgendaRouteMap.native';
