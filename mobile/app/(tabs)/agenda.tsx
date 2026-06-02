import { AgendaRouteMap } from '@/components/AgendaRouteMap';
import { ScreenChrome } from '@/components/ScreenChrome';
import { StopCard } from '@/components/StopCard';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { space } from '@/constants/layout';
import { useDemoGps } from '@/context/DemoGpsContext';
import { isDemoToolsEnabled } from '@/lib/demoTools';
import { fetchRouteDay } from '@/lib/api';
import { distanceMeters } from '@/lib/geo';
import { t } from '@/lib/i18n';
import { buildForwardWeekDates, todayIsoDate } from '@/lib/mockData';
import { loadRouteFromCache, saveRouteToCache } from '@/lib/routesCache';
import { getVisit, type VisitLocal } from '@/lib/visitStore';
import type { RotaDia } from '@rg-ambiental/shared';
import { useFocusEffect } from '@react-navigation/native';
import { useLocalSearchParams } from 'expo-router';
import * as Location from 'expo-location';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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

function weekdayShort(iso: string): string {
  const label = new Date(`${iso}T12:00:00`).toLocaleDateString('pt-BR', { weekday: 'short' });
  return label.replace(/\.$/, '').trim();
}

const CHIP_WIDTH = 86;

type StopFilter = 'all' | 'pending' | 'active' | 'done';

function visitMatchesFilter(v: VisitLocal | null, f: StopFilter): boolean {
  if (f === 'all') return true;
  if (f === 'pending') return !v?.check_in_at;
  if (f === 'active') return Boolean(v?.check_in_at && !v?.check_out_at);
  return Boolean(v?.check_out_at);
}

export default function AgendaScreen() {
  const scheme = useColorScheme() ?? 'light';
  const palette = Colors[scheme];
  const A = t('agenda');
  const params = useLocalSearchParams<{ date?: string | string[] }>();
  const dateFromUrl = useMemo(() => {
    const raw = params.date;
    const s = Array.isArray(raw) ? raw[0] : raw;
    return s && /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : null;
  }, [params.date]);

  const week = useMemo(() => buildForwardWeekDates(), []);
  const today = todayIsoDate();
  const tomorrow = week[1] ?? null;

  const [selectedDate, setSelectedDate] = useState(() => dateFromUrl ?? today);
  const weekScrollRef = useRef<ScrollView>(null);
  const { simulateAtClient, setSimulateAtClient } = useDemoGps();
  const [route, setRoute] = useState<RotaDia | null>(null);
  const [loading, setLoading] = useState(true);
  const [visits, setVisits] = useState<Record<string, VisitLocal | null>>({});
  const [stopFilter, setStopFilter] = useState<StopFilter>('all');
  const [nearStopId, setNearStopId] = useState<string | null>(null);
  const showDemoGps = isDemoToolsEnabled();

  useEffect(() => {
    if (dateFromUrl) setSelectedDate(dateFromUrl);
  }, [dateFromUrl]);

  useEffect(() => {
    const idx = week.findIndex((d) => d === today);
    if (idx <= 0) return;
    const tmr = setTimeout(() => {
      weekScrollRef.current?.scrollTo({ x: Math.max(0, idx * CHIP_WIDTH - 48), animated: true });
    }, 150);
    return () => clearTimeout(tmr);
  }, [today, week]);

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

  const activeStop = useMemo(() => {
    if (!route?.stops.length) return null;
    return route.stops.find((s) => !visits[s.id]?.check_out_at) ?? route.stops[0];
  }, [route, visits]);

  useFocusEffect(
    useCallback(() => {
      if (!route?.stops.length || !activeStop || selectedDate !== today) {
        setNearStopId(null);
        return () => setNearStopId(null);
      }
      const [lng, lat] = activeStop.geo.coordinates;
      let sub: Location.LocationSubscription | undefined;

      const tick = (plat: number, plng: number) => {
        const d = distanceMeters(plat, plng, lat, lng);
        const v = getVisit(route.date, activeStop.id);
        setNearStopId(d < 130 && !v?.check_in_at ? activeStop.id : null);
      };

      if (showDemoGps && simulateAtClient) {
        tick(lat, lng);
        return () => setNearStopId(null);
      }

      (async () => {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setNearStopId(null);
          return;
        }
        sub = await Location.watchPositionAsync(
          { accuracy: Location.Accuracy.Balanced, timeInterval: 22000, distanceInterval: 45 },
          (pos) => tick(pos.coords.latitude, pos.coords.longitude),
        );
        const once = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        tick(once.coords.latitude, once.coords.longitude);
      })().catch(() => setNearStopId(null));

      return () => {
        sub?.remove();
        setNearStopId(null);
      };
    }, [activeStop, route, selectedDate, simulateAtClient, showDemoGps, today]),
  );

  const filteredStops = useMemo(() => {
    if (!route) return [];
    return route.stops.filter((s) => visitMatchesFilter(visits[s.id] ?? null, stopFilter));
  }, [route, visits, stopFilter]);

  const mapRegion = route ? regionForStops(route.stops) : regionForStops([]);

  return (
    <ScreenChrome title={A.title} subtitle={A.subtitle} scrollable={false}>
      <View style={styles.column}>
        <Text style={[styles.weekHint, { color: palette.textSecondary }]}>{A.weekHint}</Text>
        <ScrollView
          ref={weekScrollRef}
          horizontal
          nestedScrollEnabled
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.week}>
          {week.map((d) => {
            const active = d === selectedDate;
            const isToday = d === today;
            const isTomorrow = tomorrow && d === tomorrow;
            const sub = isToday ? A.todayChip : isTomorrow ? A.tomorrowChip : weekdayShort(d);
            return (
              <Pressable
                key={d}
                onPress={() => setSelectedDate(d)}
                style={[
                  styles.dayChip,
                  {
                    borderColor: active ? palette.tint : palette.border,
                    backgroundColor: active ? palette.tint : palette.card,
                    minWidth: CHIP_WIDTH,
                  },
                ]}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                accessibilityLabel={`${A.dayA11y} ${d}`}>
                <Text style={[styles.dayText, { color: active ? '#fff' : palette.text }]}>
                  {d.slice(8, 10)}/{d.slice(5, 7)}
                </Text>
                <Text
                  style={[styles.daySub, { color: active ? '#eafff7' : palette.textSecondary }]}
                  numberOfLines={1}>
                  {sub}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          {(
            [
              ['all', A.filterAll],
              ['pending', A.filterPending],
              ['active', A.filterActive],
              ['done', A.filterDone],
            ] as const
          ).map(([id, label]) => {
            const on = stopFilter === id;
            return (
              <Pressable
                key={id}
                onPress={() => setStopFilter(id)}
                style={[
                  styles.filterChip,
                  { borderColor: on ? palette.tint : palette.border, backgroundColor: on ? `${palette.tint}14` : palette.card },
                ]}>
                <Text style={{ color: on ? palette.tint : palette.text, fontWeight: '800', fontSize: 12 }}>{label}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {showDemoGps ? (
        <View style={[styles.banner, { backgroundColor: palette.card, borderColor: palette.border }]}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.bannerTitle, { color: palette.text }]}>{A.gpsDemoTitle}</Text>
            <Text style={[styles.bannerBody, { color: palette.textSecondary }]}>{A.gpsDemoBody}</Text>
          </View>
          <Switch value={simulateAtClient} onValueChange={setSimulateAtClient} accessibilityLabel="Simular GPS no cliente" />
        </View>
        ) : null}

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
            filteredStops.length ? (
              filteredStops.map((s) => (
              <StopCard
                key={s.id}
                stop={s}
                routeDate={route.date}
                visit={visits[s.id] ?? null}
                onMutate={() => reloadVisits(route)}
                highlightArrival={nearStopId === s.id}
              />
              ))
            ) : (
              <Text style={{ color: palette.textSecondary }}>{A.filterEmpty}</Text>
            )
          ) : (
            <Text style={{ color: palette.textSecondary }}>{A.noRoute}</Text>
          )}
        </ScrollView>
      </View>
    </ScreenChrome>
  );
}

const styles = StyleSheet.create({
  column: { flex: 1, minHeight: 0, gap: space.md },
  weekHint: { fontSize: 13, fontWeight: '600', marginBottom: -4 },
  week: { gap: 8, paddingBottom: 4, paddingRight: 8 },
  filterRow: { gap: 8, paddingBottom: 4 },
  filterChip: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 999, borderWidth: 1, marginRight: 6 },
  dayChip: {
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 14,
    borderWidth: 1,
    marginRight: 8,
    alignItems: 'center',
  },
  dayText: { fontWeight: '900', textAlign: 'center' },
  daySub: { fontSize: 11, textAlign: 'center', marginTop: 2, textTransform: 'capitalize' },
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
    height: 200,
  },
  stopsScroll: { flex: 1, minHeight: 0 },
  stopsContent: { gap: space.lg, paddingBottom: space.md },
});
