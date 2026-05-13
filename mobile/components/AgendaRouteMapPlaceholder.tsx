import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { t } from '@/lib/i18n';
import type { RotaDia } from '@rg-ambiental/shared';
import * as Linking from 'expo-linking';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { AgendaRouteMapProps } from './AgendaRouteMap.types';

function validCoord(lat: number, lng: number) {
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    Math.abs(lat) <= 90 &&
    Math.abs(lng) <= 180
  );
}

function firstStopMapsUrl(route: RotaDia): string | null {
  const s = route.stops[0];
  if (!s) return null;
  const [lng, lat] = s.geo.coordinates;
  if (!validCoord(lat, lng)) return null;
  return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
}

export function AgendaMapPlaceholder({ route, mapRegion }: AgendaRouteMapProps) {
  const scheme = useColorScheme() ?? 'light';
  const p = Colors[scheme];
  const M = t('agendaMap');
  const url = firstStopMapsUrl(route);
  const open = () => {
    if (url) void Linking.openURL(url);
  };
  return (
    <View
      style={[styles.placeholder, { backgroundColor: p.card }]}
      accessibilityLabel="Mapa embutido indisponível — abrir no Google Maps">
      <Text style={[styles.phTitle, { color: p.text }]}>{M.embeddedTitle}</Text>
      <Text style={[styles.phBody, { color: p.textSecondary }]}>{M.embeddedBody}</Text>
      {url ? (
        <Pressable
          onPress={open}
          style={({ pressed }) => [styles.phBtn, { backgroundColor: p.tint, opacity: pressed ? 0.88 : 1 }]}
          accessibilityRole="button">
          <Text style={styles.phBtnText}>{M.openMaps}</Text>
        </Pressable>
      ) : null}
      <Text style={[styles.phMeta, { color: p.textSecondary }]}>
        {M.centerApprox}: {mapRegion.latitude.toFixed(4)}, {mapRegion.longitude.toFixed(4)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  placeholder: {
    flex: 1,
    padding: 14,
    justifyContent: 'center',
    gap: 8,
  },
  phTitle: { fontSize: 15, fontWeight: '800' },
  phBody: { fontSize: 13, lineHeight: 18 },
  phBtn: {
    alignSelf: 'flex-start',
    marginTop: 4,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
  },
  phBtnText: { color: '#fff', fontWeight: '800', fontSize: 13 },
  phMeta: { fontSize: 11, marginTop: 4 },
});
