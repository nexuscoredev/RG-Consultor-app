import Colors from '@/constants/Colors';
import { HapticPressable } from '@/components/ui/HapticPressable';
import { t } from '@/lib/i18n';
import type { RotaDia } from '@rg-ambiental/shared';
import * as Linking from 'expo-linking';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import type { AgendaRouteMapProps } from './AgendaRouteMap.types';

export type { AgendaRouteMapProps } from './AgendaRouteMap.types';

const c = Colors.light;

function validCoord(lat: number, lng: number) {
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    Math.abs(lat) <= 90 &&
    Math.abs(lng) <= 180
  );
}

function stopMapsUrl(stop: RotaDia['stops'][number]): string | null {
  const [lng, lat] = stop.geo.coordinates;
  if (!validCoord(lat, lng)) return null;
  const q = encodeURIComponent(`${stop.addressLine}, ${stop.city}`);
  return `https://www.google.com/maps/search/?api=1&query=${q}`;
}

function routeDirectionsUrl(route: RotaDia): string | null {
  const coords = route.stops
    .map((s) => {
      const [lng, lat] = s.geo.coordinates;
      return validCoord(lat, lng) ? `${lat},${lng}` : null;
    })
    .filter((x): x is string => x != null);
  if (coords.length === 0) return null;
  if (coords.length === 1) {
    return `https://www.google.com/maps/dir/?api=1&destination=${coords[0]}`;
  }
  const destination = coords[coords.length - 1];
  const waypoints = coords.slice(0, -1).join('|');
  return `https://www.google.com/maps/dir/?api=1&destination=${destination}&waypoints=${waypoints}`;
}

/** Na web, `react-native-maps` não roda — lista de paradas com links para o Google Maps. */
export function AgendaRouteMap({ route }: AgendaRouteMapProps) {
  const M = t('agendaMap');
  const routeUrl = routeDirectionsUrl(route);

  return (
    <View style={[styles.fill, { backgroundColor: c.background }]}>
      <Text style={[styles.title, { color: c.text }]}>{M.webTitle}</Text>
      <Text style={[styles.body, { color: c.textSecondary }]}>{M.webBody}</Text>
      {routeUrl ? (
        <HapticPressable
          onPress={() => void Linking.openURL(routeUrl)}
          style={({ pressed }) => [styles.routeBtn, { backgroundColor: c.tint, opacity: pressed ? 0.88 : 1 }]}>
          <Text style={styles.routeBtnText}>{M.webRouteOpen}</Text>
        </HapticPressable>
      ) : null}
      <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
        {route.stops.map((stop, index) => {
          const url = stopMapsUrl(stop);
          return (
            <View key={stop.id} style={[styles.stopRow, { borderColor: c.border }]}>
              <Text style={[styles.stopOrder, { color: c.tint }]}>{index + 1}</Text>
              <View style={styles.stopBody}>
                <Text style={[styles.stopName, { color: c.text }]}>{stop.accountName}</Text>
                <Text style={[styles.stopAddr, { color: c.textSecondary }]}>
                  {stop.addressLine} · {stop.city}
                </Text>
                {url ? (
                  <HapticPressable onPress={() => void Linking.openURL(url)}>
                    <Text style={[styles.stopLink, { color: c.tint }]}>{M.webStopOpen}</Text>
                  </HapticPressable>
                ) : null}
              </View>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, padding: 16, gap: 8 },
  title: { fontSize: 16, fontWeight: '800' },
  body: { fontSize: 13, lineHeight: 18 },
  routeBtn: {
    alignSelf: 'flex-start',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    marginTop: 4,
  },
  routeBtnText: { color: '#fff', fontWeight: '800', fontSize: 13 },
  list: { flex: 1, marginTop: 8 },
  listContent: { gap: 8, paddingBottom: 8 },
  stopRow: {
    flexDirection: 'row',
    gap: 10,
    padding: 12,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
  },
  stopOrder: { fontSize: 15, fontWeight: '800', width: 22 },
  stopBody: { flex: 1, gap: 4 },
  stopName: { fontSize: 14, fontWeight: '700' },
  stopAddr: { fontSize: 12, lineHeight: 17 },
  stopLink: { fontSize: 12, fontWeight: '700', marginTop: 2 },
});
