import type { RotaDia } from '@rg-ambiental/shared';

export type AgendaRouteMapProps = {
  route: RotaDia;
  mapRegion: {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  };
  /** Ignorado no Android (sem mapa nativo embutido). iOS: MapKit quando true. */
  mapsEnabled?: boolean;
};
