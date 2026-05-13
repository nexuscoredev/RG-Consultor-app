import type { RotaDia } from '@rg-ambiental/shared';
import { StyleSheet, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { AgendaMapPlaceholder } from './AgendaRouteMapPlaceholder';
import type { AgendaRouteMapProps } from './AgendaRouteMap.types';

export type { AgendaRouteMapProps } from './AgendaRouteMap.types';

function validCoord(lat: number, lng: number) {
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    Math.abs(lat) <= 90 &&
    Math.abs(lng) <= 180
  );
}

/** iOS: MapKit (sem Google Maps provider). */
export function AgendaRouteMap({ route, mapRegion, mapsEnabled = true }: AgendaRouteMapProps) {
  if (!mapsEnabled) {
    return <AgendaMapPlaceholder route={route} mapRegion={mapRegion} />;
  }

  const region = {
    ...mapRegion,
    latitude: Number.isFinite(mapRegion.latitude) ? mapRegion.latitude : -23.55,
    longitude: Number.isFinite(mapRegion.longitude) ? mapRegion.longitude : -46.63,
    latitudeDelta: Math.max(0.01, mapRegion.latitudeDelta || 0.08),
    longitudeDelta: Math.max(0.01, mapRegion.longitudeDelta || 0.08),
  };

  return (
    <View style={styles.fill} collapsable={false}>
      <MapView
        style={styles.map}
        region={region}
        accessibilityLabel="Mapa das paradas do dia"
        scrollEnabled={false}
        zoomEnabled
        rotateEnabled={false}
        pitchEnabled={false}
        toolbarEnabled={false}
        mapType="standard"
        loadingEnabled>
        {route.stops.map((s: RotaDia['stops'][number]) => {
          const [lng, lat] = s.geo.coordinates;
          if (!validCoord(lat, lng)) return null;
          return (
            <Marker
              key={s.id}
              coordinate={{ latitude: lat, longitude: lng }}
              title={s.accountName ?? 'Parada'}
              description={s.addressLine ?? ''}
            />
          );
        })}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  map: { ...StyleSheet.absoluteFillObject },
});
