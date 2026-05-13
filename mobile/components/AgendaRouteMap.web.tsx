import Colors from '@/constants/Colors';
import { StyleSheet, Text, View } from 'react-native';
import type { AgendaRouteMapProps } from './AgendaRouteMap.types';

export type { AgendaRouteMapProps } from './AgendaRouteMap.types';

const c = Colors.light;

/** Na web, `react-native-maps` não é suportado — use iOS/Android ou emulador. */
export function AgendaRouteMap({ route }: AgendaRouteMapProps) {
  return (
    <View style={[styles.fill, { backgroundColor: c.background }]}>
      <Text style={[styles.title, { color: c.text }]}>Mapa no celular</Text>
      <Text style={[styles.body, { color: c.textSecondary }]}>
        O mapa embutido usa APIs nativas e não roda no navegador. Abra o mesmo projeto no Expo Go (Android/iOS) ou em
        emulador para ver as paradas no mapa.
      </Text>
      <Text style={[styles.meta, { color: c.tint }]}>{route.stops.length} parada(s) neste dia — lista abaixo.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, padding: 16, justifyContent: 'center', gap: 8 },
  title: { fontSize: 16, fontWeight: '800' },
  body: { fontSize: 13, lineHeight: 18 },
  meta: { fontSize: 12, fontWeight: '600', marginTop: 4 },
});
