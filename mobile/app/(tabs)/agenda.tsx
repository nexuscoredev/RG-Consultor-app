import { AgendaRouteMap } from '@/components/AgendaRouteMap';
import { isNativeMapsEnabled } from '@/lib/mapsConfig';
import { HapticPressable } from '@/components/ui/HapticPressable';
import { useTabletLayout } from '@/hooks/useTabletLayout';
import { ScreenChrome } from '@/components/ScreenChrome';
import { StopCard } from '@/components/StopCard';
import { Surface } from '@/components/ui/Surface';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { radius, space } from '@/constants/layout';
import { typography } from '@/constants/typography';
import { useDemoGps } from '@/context/DemoGpsContext';
import { isDemoToolsEnabled } from '@/lib/demoTools';
import { isApiEnabled } from '@/lib/apiConfig';
import { fetchRouteDay } from '@/lib/api';
import { distanceMeters } from '@/lib/geo';
import { t } from '@/lib/i18n';
import { buildForwardWeekDates, routeForDate, todayIsoDate } from '@/lib/mockData';
import { loadRouteFromCache, saveRouteToCache } from '@/lib/routesCache';
import { getVisit, type VisitLocal } from '@/lib/visitStore';
import type { Parada, RotaDia } from '@rg-ambiental/shared';
import { useFocusEffect } from '@react-navigation/native';
import { useLocalSearchParams, Link, type Href } from 'expo-router';
import * as Location from 'expo-location';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
  type ListRenderItem,
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
  const { mapMinHeight, dayChipWidth, agendaStopColumns, isTablet, isWide, touchMinHeight } = useTabletLayout();
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
  const [routeSource, setRouteSource] = useState<'live' | 'cache' | 'mock' | 'error'>('live');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
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
      weekScrollRef.current?.scrollTo({ x: Math.max(0, idx * dayChipWidth - 48), animated: true });
    }, 150);
    return () => clearTimeout(tmr);
  }, [today, week, dayChipWidth]);

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

  const applyRouteFallback = useCallback(
    (iso: string) => {
      const cached = loadRouteFromCache(iso);
      if (cached) {
        setRoute(cached);
        reloadVisits(cached);
        setRouteSource('cache');
        return;
      }
      if (isApiEnabled()) {
        setRoute(null);
        setRouteSource('error');
        return;
      }
      const mock = routeForDate(iso);
      setRoute(mock);
      reloadVisits(mock);
      setRouteSource('mock');
    },
    [reloadVisits],
  );

  const loadRoute = useCallback(
    async (iso: string, opts?: { silent?: boolean }) => {
      if (!opts?.silent) setLoading(true);
      try {
        const fresh = await fetchRouteDay(iso);
        saveRouteToCache(fresh);
        setRoute(fresh);
        reloadVisits(fresh);
        setRouteSource('live');
      } catch {
        applyRouteFallback(iso);
      } finally {
        if (!opts?.silent) setLoading(false);
      }
    },
    [applyRouteFallback, reloadVisits],
  );

  useEffect(() => {
    void loadRoute(selectedDate);
  }, [selectedDate, loadRoute]);

  const onAgendaRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadRoute(selectedDate, { silent: true });
    } finally {
      setRefreshing(false);
    }
  }, [loadRoute, selectedDate]);

  useFocusEffect(
    useCallback(() => {
      if (route) reloadVisits(route);
    }, [route, reloadVisits]),
  );

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
          { accuracy: Location.Accuracy.Balanced, timeInterval: 45_000, distanceInterval: 60 },
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

  const listHeader = useMemo(
    () => (
      <View style={styles.headerBlock}>
        {routeSource === 'cache' ? (
          <Surface style={[styles.routeBanner, { borderColor: palette.tint, backgroundColor: `${palette.tint}12` }]}>
            <Text style={[typography.captionBold, { color: palette.tint }]}>{A.routeCacheBanner}</Text>
          </Surface>
        ) : null}
        {routeSource === 'error' ? (
          <Surface style={[styles.routeBanner, { borderColor: palette.danger, backgroundColor: `${palette.danger}14` }]}>
            <Text style={[typography.captionBold, { color: palette.danger }]}>{A.routeErrorBanner}</Text>
          </Surface>
        ) : null}
        {routeSource === 'mock' ? (
          <Surface style={[styles.routeBanner, { borderColor: palette.border, backgroundColor: palette.card }]}>
            <Text style={[typography.caption, { color: palette.textSecondary }]}>{t('clients').demoRouteHint}</Text>
            <Link href={'/(tabs)/commercial/clients' as Href} asChild>
              <HapticPressable style={{ marginTop: 6 }}>
                <Text style={[typography.captionBold, { color: palette.tint }]}>{t('clients').hubCta}</Text>
              </HapticPressable>
            </Link>
          </Surface>
        ) : null}

        <Text style={[styles.weekHint, { color: palette.textSecondary }]}>{A.weekHint}</Text>
        {isWide ? (
          <View style={styles.wideHeaderRow}>
            <View style={styles.wideHeaderControls}>
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
                    <HapticPressable
                      key={d}
                      onPress={() => setSelectedDate(d)}
                      style={[
                        styles.dayChip,
                        isTablet && styles.dayChipTablet,
                        {
                          borderColor: active ? palette.tint : palette.border,
                          backgroundColor: active ? palette.tint : palette.card,
                          minWidth: dayChipWidth,
                          minHeight: touchMinHeight,
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
                    </HapticPressable>
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
                    <HapticPressable
                      key={id}
                      onPress={() => setStopFilter(id)}
                      style={[
                        styles.filterChip,
                        isTablet && styles.filterChipTablet,
                        {
                          borderColor: on ? palette.tint : palette.border,
                          backgroundColor: on ? `${palette.tint}14` : palette.card,
                          minHeight: touchMinHeight,
                        },
                      ]}>
                      <Text
                        style={{
                          color: on ? palette.tint : palette.text,
                          fontWeight: '800',
                          fontSize: isTablet ? 14 : 12,
                        }}>
                        {label}
                      </Text>
                    </HapticPressable>
                  );
                })}
              </ScrollView>

              {showDemoGps ? (
                <View style={[styles.banner, { backgroundColor: palette.card, borderColor: palette.border }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.bannerTitle, { color: palette.text }]}>{A.gpsDemoTitle}</Text>
                    <Text style={[styles.bannerBody, { color: palette.textSecondary }]}>{A.gpsDemoBody}</Text>
                  </View>
                  <Switch
                    value={simulateAtClient}
                    onValueChange={setSimulateAtClient}
                    accessibilityLabel="Simular GPS no cliente"
                  />
                </View>
              ) : null}

              {loading ? <ActivityIndicator color={palette.tint} /> : null}
            </View>

            {route ? (
              <View style={[styles.mapCard, styles.mapCardWide, { borderColor: palette.border, minHeight: mapMinHeight }]}>
                <AgendaRouteMap route={route} mapRegion={mapRegion} mapsEnabled={isNativeMapsEnabled()} />
              </View>
            ) : null}
          </View>
        ) : (
          <>
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
                  <HapticPressable
                    key={d}
                    onPress={() => setSelectedDate(d)}
                    style={[
                      styles.dayChip,
                      isTablet && styles.dayChipTablet,
                      {
                        borderColor: active ? palette.tint : palette.border,
                        backgroundColor: active ? palette.tint : palette.card,
                        minWidth: dayChipWidth,
                        minHeight: touchMinHeight,
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
                  </HapticPressable>
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
                  <HapticPressable
                    key={id}
                    onPress={() => setStopFilter(id)}
                    style={[
                      styles.filterChip,
                      isTablet && styles.filterChipTablet,
                      {
                        borderColor: on ? palette.tint : palette.border,
                        backgroundColor: on ? `${palette.tint}14` : palette.card,
                        minHeight: touchMinHeight,
                      },
                    ]}>
                    <Text
                      style={{
                        color: on ? palette.tint : palette.text,
                        fontWeight: '800',
                        fontSize: isTablet ? 14 : 12,
                      }}>
                      {label}
                    </Text>
                  </HapticPressable>
                );
              })}
            </ScrollView>

            {showDemoGps ? (
              <View style={[styles.banner, { backgroundColor: palette.card, borderColor: palette.border }]}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.bannerTitle, { color: palette.text }]}>{A.gpsDemoTitle}</Text>
                  <Text style={[styles.bannerBody, { color: palette.textSecondary }]}>{A.gpsDemoBody}</Text>
                </View>
                <Switch
                  value={simulateAtClient}
                  onValueChange={setSimulateAtClient}
                  accessibilityLabel="Simular GPS no cliente"
                />
              </View>
            ) : null}

            {loading ? <ActivityIndicator color={palette.tint} /> : null}

            {route ? (
              <View style={[styles.mapCard, { borderColor: palette.border, height: mapMinHeight }]}>
                <AgendaRouteMap route={route} mapRegion={mapRegion} mapsEnabled={isNativeMapsEnabled()} />
              </View>
            ) : null}
          </>
        )}
      </View>
    ),
    [
      A,
      dayChipWidth,
      isTablet,
      isWide,
      loading,
      mapMinHeight,
      mapRegion,
      palette,
      route,
      routeSource,
      selectedDate,
      showDemoGps,
      simulateAtClient,
      stopFilter,
      today,
      tomorrow,
      touchMinHeight,
      week,
    ],
  );

  const listEmpty = useMemo(() => {
    if (loading) return null;
    return (
      <Text style={{ color: palette.textSecondary, textAlign: 'center', marginTop: space.md }}>
        {!route ? A.noRoute : A.filterEmpty}
      </Text>
    );
  }, [A.filterEmpty, A.noRoute, loading, palette.textSecondary, route]);

  const renderStop: ListRenderItem<Parada> = useCallback(
    ({ item: s }) => (
      <View style={agendaStopColumns > 1 ? styles.stopGridCell : styles.stopCell}>
        <StopCard
          stop={s}
          routeDate={route!.date}
          visit={visits[s.id] ?? null}
          onMutate={() => reloadVisits(route!)}
          highlightArrival={nearStopId === s.id}
        />
      </View>
    ),
    [agendaStopColumns, nearStopId, reloadVisits, route, visits],
  );

  return (
    <ScreenChrome title={A.title} subtitle={A.subtitle} scrollable={false}>
      <FlatList
        style={styles.list}
        data={route ? filteredStops : []}
        key={`agenda-stops-${agendaStopColumns}`}
        keyExtractor={(s) => s.id}
        numColumns={agendaStopColumns}
        renderItem={renderStop}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={listEmpty}
        columnWrapperStyle={agendaStopColumns > 1 ? styles.stopRow : undefined}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void onAgendaRefresh()}
            tintColor={palette.tint}
            colors={[palette.tint, palette.forestDeep]}
            progressBackgroundColor={palette.card}
          />
        }
        initialNumToRender={4}
        maxToRenderPerBatch={4}
        windowSize={5}
        removeClippedSubviews
      />
    </ScreenChrome>
  );
}

const styles = StyleSheet.create({
  list: { flex: 1 },
  listContent: { gap: space.lg, paddingBottom: space.md },
  headerBlock: { gap: space.md },
  wideHeaderRow: { flexDirection: 'row', alignItems: 'stretch', gap: space.lg },
  wideHeaderControls: { flex: 1, gap: space.md, minWidth: 280 },
  stopCell: { width: '100%', marginBottom: space.lg },
  stopGridCell: { flex: 1, marginBottom: space.lg },
  stopRow: { gap: space.md },
  routeBanner: { padding: space.sm, borderRadius: radius.md, borderWidth: 1 },
  weekHint: { fontSize: 13, fontWeight: '600', marginBottom: -4 },
  week: { gap: 8, paddingBottom: 4, paddingRight: 8 },
  filterRow: { gap: 8, paddingBottom: 4 },
  filterChip: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 999, borderWidth: 1, marginRight: 6, justifyContent: 'center' },
  filterChipTablet: { paddingHorizontal: 16 },
  dayChip: {
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 14,
    borderWidth: 1,
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayChipTablet: { paddingVertical: 12, paddingHorizontal: 14 },
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
  },
  mapCardWide: { flex: 1.1, minWidth: 320 },
});
