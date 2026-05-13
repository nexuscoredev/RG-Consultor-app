import { AgendaRouteMap } from '@/components/AgendaRouteMap';
import { ScreenChrome } from '@/components/ScreenChrome';
import { StopCard } from '@/components/StopCard';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { space } from '@/constants/layout';
import { useDemoGps } from '@/context/DemoGpsContext';
import { fetchRouteDay } from '@/lib/api';
import { buildMockWeekRoutes, todayIsoDate } from '@/lib/mockData';
import { loadRouteFromCache, saveRouteToCache } from '@/lib/routesCache';
import { t } from '@/lib/i18n';
import { getVisit, type VisitLocal } from '@/lib/visitStore';
import type { RotaDia } from '@rg-ambiental/shared';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';

function regionForStops(stops: RotaDia['stops']) {
  if (!stops.length) {
    return { latitude: -23.55, longitude: -46.63, latitudeDelta: 0.2, longitudeDelta: 0.2 };
  }
  let minLat = 90,
    maxLat = -90,
    minLng = 180,
    maxLng = -180;
  for (const s of stops) {
    const [lng, lat] = s.geo.coordinates;
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;
    minLat = Math.min(minLat, lat);
    maxLat = Math.max(maxLat, lat);
    minLng = Math.min(minLng, lng);
    maxLng = Math.max(maxLng, lng);
  }
  if (minLat > maxLat || minLng > maxLng) {
    return { latitude: -23.55, longitude: -46.63, latitudeDelta: 0.2, longitudeDelta: 0.2 };
  }
  const latD = Math.max(0.04, (maxLat - minLat) * 1.8 || 0.08);
  const lngD = Math.max(0.04, (maxLng - minLng) * 1.8 || 0.08);
  return {
    latitude: (minLat + maxLat) / 2,
    longitude: (minLng + maxLng) / 2,
    latitudeDelta: latD,
    longitudeDelta: lngD,
  };
}

export default function AgendaScreen() {
  const scheme = useColorScheme() ?? 'light';
  const palette = Colors[scheme];
  const A = t('agenda');
  const { simulateAtClient, setSimulateAtClient } = useDemoGps();
  const [selectedDate, setSelectedDate] = useState(todayIsoDate());
  const [route, setRoute] = useState<RotaDia | null>(null);
  const [loading, setLoading] = useState(true);
  const [visits, setVisits] = useState<Record<string, VisitLocal | null>>({});
  const week = useMemo(() => buildMockWeekRoutes().map((r) => r.date), []);

  const reloadVisits = useCallback((r: RotaDia) => {
    try {
      const m: Record<string, VisitLocal | null> = {};
      for (const s of r.stops) {
        m[s.id] = getVisit(r.date, s.id);
      }
      setVisits(m);
    } catch {
      setVisits({});
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const fresh = await fetchRouteDay(selectedDate);
        if (cancelled) return;
        saveRouteToCache(fresh);
        setRoute(fresh);
        reloadVisits(fresh);
      } catch {
        const cached = loadRouteFromCache(selectedDate);
        if (!cancelled && cached) {
          setRoute(cached);
          reloadVisits(cached);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedDate, reloadVisits]);

  const mapRegion = route ? regionForStops(route.stops) : regionForStops([]);

  return (
    <ScreenChrome title={A.title} subtitle={A.subtitle} scrollable={false}>
      <View style={styles.column}>
        <ScrollView
          horizontal
          nestedScrollEnabled
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.week}>
          {week.map((d) => {
            const active = d === selectedDate;
            return (
              <Pressable
                key={d}
                onPress={() => setSelectedDate(d)}
                style={[
                  styles.dayChip,
                  { borderColor: palette.border, backgroundColor: active ? palette.tint : palette.card },
                ]}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                accessibilityLabel={`Dia ${d}`}>
                <Text style={[styles.dayText, { color: active ? '#fff' : palette.text }]}>
                  {d.slice(8, 10)}/{d.slice(5, 7)}
                </Text>
                <Text style={[styles.daySub, { color: active ? '#eafff7' : palette.textSecondary }]}>
                  {d === todayIsoDate() ? A.todayChip : ''}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <View style={[styles.banner, { backgroundColor: palette.card, borderColor: palette.border }]}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.bannerTitle, { color: palette.text }]}>{A.gpsDemoTitle}</Text>
            <Text style={[styles.bannerBody, { color: palette.textSecondary }]}>{A.gpsDemoBody}</Text>
          </View>
          <Switch value={simulateAtClient} onValueChange={setSimulateAtClient} accessibilityLabel="Simular GPS no cliente" />
        </View>

        {loading ? <ActivityIndicator color={palette.tint} /> : null}

        {route ? (
          <View style={[styles.mapCard, { borderColor: palette.border }]}>
            <AgendaRouteMap route={route} mapRegion={mapRegion} />
          </View>
        ) : null}

        <ScrollView
          nestedScrollEnabled
          style={styles.stopsScroll}
          contentContainerStyle={styles.stopsContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">
          {route ? (
            route.stops.map((s) => (
              <StopCard
                key={s.id}
                stop={s}
                routeDate={route.date}
                visit={visits[s.id] ?? null}
                onMutate={() => reloadVisits(route)}
              />
            ))
          ) : (
            <Text style={{ color: palette.textSecondary }}>{A.noRoute}</Text>
          )}
        </ScrollView>
      </View>
    </ScreenChrome>
  );
}

const styles = StyleSheet.create({
  column: { flex: 1, minHeight: 0, gap: space.lg },
  week: { gap: 8, paddingBottom: 8 },
  dayChip: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginRight: 8,
    minWidth: 72,
  },
  dayText: { fontWeight: '900', textAlign: 'center' },
  daySub: { fontSize: 11, textAlign: 'center', marginTop: 2 },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
  },
  bannerTitle: { fontSize: 15, fontWeight: '800' },
  bannerBody: { fontSize: 13, lineHeight: 18, marginTop: 4 },
  mapCard: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    height: 220,
  },
  stopsScroll: { flex: 1, minHeight: 0 },
  stopsContent: { gap: space.lg, paddingBottom: space.md },
});
