import { HomePullTip } from '@/components/HomePullTip';
import { CommercialHubCard } from '@/components/home/CommercialHubCard';
import { HomeHeroGlass } from '@/components/home/HomeHeroGlass';
import { PipelineSummaryCard } from '@/components/home/PipelineSummaryCard';
import { RouteDayTimeline } from '@/components/home/RouteDayTimeline';
import { RgConsultorLogo } from '@/components/RgConsultorLogo';
import { ScreenChrome } from '@/components/ScreenChrome';
import { StopCard } from '@/components/StopCard';
import { SyncBanner } from '@/components/SyncBanner';
import { Surface } from '@/components/ui/Surface';
import { HapticPressable } from '@/components/ui/HapticPressable';
import { SecondaryButton } from '@/components/ui/SecondaryButton';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { radius, space } from '@/constants/layout';
import { typography } from '@/constants/typography';
import { useDemoGps } from '@/context/DemoGpsContext';
import { useGamification } from '@/context/GamificationContext';
import { useSync } from '@/context/SyncContext';
import { isApiEnabled } from '@/lib/apiConfig';
import { fetchRouteDay } from '@/lib/api';
import { distanceMeters } from '@/lib/geo';
import { MISSIONS } from '@/lib/gamificationEngine';
import { t } from '@/lib/i18n';
import {
  addDaysIso,
  getDefaultRouteToday,
  routeForDate,
  todayIsoDate,
} from '@/lib/mockData';
import { loadRouteFromCache, saveRouteToCache } from '@/lib/routesCache';
import { getVisit, type VisitLocal } from '@/lib/visitStore';
import type { RotaDia } from '@rg-ambiental/shared';
import { useFocusEffect } from '@react-navigation/native';
import * as Location from 'expo-location';
import { iconSize } from '@/constants/icons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Link, type Href } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTabletLayout } from '@/hooks/useTabletLayout';

export default function HomeScreen() {
  const scheme = useColorScheme() ?? 'light';
  const palette = Colors[scheme];
  const { pending, failed } = useSync();
  const { simulateAtClient } = useDemoGps();
  const { missions: missionRows } = useGamification();
  const [route, setRoute] = useState<RotaDia>(() => {
    const today = todayIsoDate();
    const cached = loadRouteFromCache(today);
    return cached ?? getDefaultRouteToday();
  });
  const [routeSource, setRouteSource] = useState<'live' | 'cache' | 'mock' | 'error'>(
    () => (loadRouteFromCache(todayIsoDate()) ? 'cache' : 'mock'),
  );
  const [visits, setVisits] = useState<Record<string, VisitLocal | null>>({});
  const [nearClient, setNearClient] = useState(false);
  const tomorrowIso = useMemo(() => addDaysIso(todayIsoDate(), 1), []);
  const [tomorrowRoute, setTomorrowRoute] = useState<RotaDia | null>(null);

  const dateLabel = useMemo(
    () =>
      new Date().toLocaleDateString('pt-BR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      }),
    [],
  );

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
    (today: string) => {
      const cached = loadRouteFromCache(today);
      if (cached) {
        setRoute(cached);
        reloadVisits(cached);
        setRouteSource('cache');
        return;
      }
      if (isApiEnabled()) {
        setRouteSource('error');
        return;
      }
      const mock = getDefaultRouteToday();
      setRoute(mock);
      reloadVisits(mock);
      setRouteSource('mock');
    },
    [reloadVisits],
  );

  const onHomeRefresh = useCallback(async () => {
    const today = todayIsoDate();
    try {
      const fresh = await fetchRouteDay(today);
      saveRouteToCache(fresh);
      setRoute(fresh);
      reloadVisits(fresh);
      setRouteSource('live');
    } catch {
      applyRouteFallback(today);
    }
  }, [applyRouteFallback, reloadVisits]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const today = todayIsoDate();
      try {
        const fresh = await fetchRouteDay(today);
        if (cancelled) return;
        saveRouteToCache(fresh);
        setRoute(fresh);
        reloadVisits(fresh);
        setRouteSource('live');
      } catch {
        if (!cancelled) applyRouteFallback(today);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [applyRouteFallback, reloadVisits]);

  useFocusEffect(
    useCallback(() => {
      if (route?.stops?.length) reloadVisits(route);
    }, [route, reloadVisits]),
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await fetchRouteDay(tomorrowIso);
        if (!cancelled) {
          saveRouteToCache(r);
          setTomorrowRoute(r);
        }
      } catch {
        if (!cancelled) setTomorrowRoute(routeForDate(tomorrowIso));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [tomorrowIso]);

  const activeStop = useMemo(() => {
    const open = route.stops.find((s) => !visits[s.id]?.check_out_at);
    return open ?? route.stops[0];
  }, [route.stops, visits]);

  const next = activeStop;

  useFocusEffect(
    useCallback(() => {
      if (!route.stops?.length || !next) return () => undefined;
      const [lng, lat] = next.geo.coordinates;
      let sub: Location.LocationSubscription | undefined;

      const tick = (plat: number, plng: number) => {
        const d = distanceMeters(plat, plng, lat, lng);
        const v = getVisit(route.date, next.id);
        setNearClient(d < 130 && !v?.check_in_at);
      };

      if (simulateAtClient) {
        tick(lat, lng);
        return () => setNearClient(false);
      }

      (async () => {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setNearClient(false);
          return;
        }
        sub = await Location.watchPositionAsync(
          { accuracy: Location.Accuracy.Balanced, timeInterval: 45_000, distanceInterval: 60 },
          (pos) => tick(pos.coords.latitude, pos.coords.longitude),
        );
        const once = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        tick(once.coords.latitude, once.coords.longitude);
      })().catch(() => setNearClient(false));

      return () => {
        sub?.remove();
        setNearClient(false);
      };
    }, [next, route.date, simulateAtClient]),
  );

  const arrivalHighlight = Boolean(next && nearClient && !visits[next.id]?.check_in_at);
  const missionDef = MISSIONS[0];
  const missionState = missionRows.find((m) => m.missionId === missionDef.id);
  const missionCur = missionState?.current ?? 0;
  const missionTgt = missionState?.target ?? missionDef.target;
  const H = t('home');
  const { isWide } = useTabletLayout();

  const settingsAction = (
    <Link href={'/(tabs)/more/settings' as Href} asChild>
      <Pressable accessibilityRole="button" accessibilityLabel={H.settingsA11y}>
        {({ pressed }) => (
          <MaterialCommunityIcons
            name="cog-outline"
            size={iconSize.lg}
            color={palette.text}
            style={{ opacity: pressed ? 0.5 : 1 }}
          />
        )}
      </Pressable>
    </Link>
  );

  if (!next) {
    return (
      <ScreenChrome title={H.title} subtitle={dateLabel} headerRight={settingsAction}>
        <Surface style={{ padding: space.lg }}>
          <RgConsultorLogo variant="home" subtitle={H.emptySubtitle} />
          <Text style={{ color: palette.textSecondary, textAlign: 'center', marginTop: space.md }}>
            {H.emptyNoStops}
          </Text>
        </Surface>
      </ScreenChrome>
    );
  }

  return (
    <ScreenChrome
      title={H.title}
      subtitle={dateLabel}
      headerRight={settingsAction}
      onRefresh={onHomeRefresh}
      footer={
        <View style={[styles.footer, { borderTopColor: palette.border, backgroundColor: palette.card }]}>
          <Text style={[styles.footerText, { color: palette.textSecondary }]}>
            {H.footerOutbox.replace('{pending}', String(pending)).replace('{failed}', String(failed))}
          </Text>
        </View>
      }>
      {!isWide ? <HomeHeroGlass dateLabel={dateLabel} /> : null}

      <HomePullTip />

      {routeSource === 'cache' ? (
        <Surface style={[styles.routeBanner, { borderColor: palette.tint, backgroundColor: `${palette.tint}12` }]}>
          <Text style={[typography.captionBold, { color: palette.tint }]}>{H.routeCacheBanner}</Text>
        </Surface>
      ) : null}
      {routeSource === 'error' ? (
        <Surface style={[styles.routeBanner, { borderColor: palette.danger, backgroundColor: `${palette.danger}14` }]}>
          <Text style={[typography.captionBold, { color: palette.danger }]}>{H.routeErrorBanner}</Text>
          <SecondaryButton
            label={H.retryRoute}
            tint
            fullWidth
            onPress={() => void onHomeRefresh()}
            accessibilityLabel={H.retryRoute}
          />
        </Surface>
      ) : null}

      {isWide ? (
        <View style={styles.wideRow}>
          <View style={styles.widePrimary}>
            <Text style={[typography.sectionLabel, styles.sectionHeading, { color: palette.textSecondary }]}>
              {arrivalHighlight ? H.atClientTitle : H.focusVisit}
            </Text>
            {arrivalHighlight ? (
              <Text style={[typography.body, styles.focusHint, { color: palette.textSecondary }]}>{H.atClientBody}</Text>
            ) : null}
            <StopCard
              stop={next}
              routeDate={route.date}
              visit={visits[next.id] ?? null}
              onMutate={() => reloadVisits(route)}
              highlightArrival={arrivalHighlight}
            />
            <RouteDayTimeline
              todayRoute={route}
              tomorrowRoute={tomorrowRoute}
              tomorrowIso={tomorrowIso}
              visitsToday={visits}
              highlightStopId={arrivalHighlight ? next.id : activeStop?.id}
            />
            <Link href={'/(tabs)/agenda' as Href} asChild>
              <SecondaryButton
                label={H.openFullAgenda}
                tint
                fullWidth
                accessibilityLabel={H.openFullAgendaA11y}
              />
            </Link>
          </View>
          <View style={styles.wideAside}>
            <PipelineSummaryCard />
            <CommercialHubCard />
            <Surface style={[styles.missionCompact, { borderColor: palette.border }]}>
              <Text style={[typography.caption, { color: palette.textSecondary }]}>{H.currentMission}</Text>
              <Text style={[typography.title, { color: palette.text }]} numberOfLines={1}>
                {missionDef.title}
              </Text>
              <Text style={[typography.caption, { color: palette.textSecondary }]}>
                {H.missionProgress.replace('{current}', String(missionCur)).replace('{target}', String(missionTgt))}
              </Text>
              <Link href={'/(tabs)/more/missions' as Href} asChild>
                <HapticPressable
                  style={[styles.ctaOutline, { borderColor: palette.tint }]}
                  accessibilityRole="button"
                  accessibilityLabel={H.openMissionCenterA11y}>
                  <Text style={[styles.ctaOutlineText, { color: palette.tint }]}>{H.viewMissions}</Text>
                </HapticPressable>
              </Link>
            </Surface>
            {pending > 0 || failed > 0 ? <SyncBanner /> : null}
          </View>
        </View>
      ) : (
        <>
          <Text style={[typography.sectionLabel, styles.sectionHeading, { color: palette.textSecondary }]}>
            {arrivalHighlight ? H.atClientTitle : H.focusVisit}
          </Text>
          {arrivalHighlight ? (
            <Text style={[typography.body, styles.focusHint, { color: palette.textSecondary }]}>{H.atClientBody}</Text>
          ) : null}
          <StopCard
            stop={next}
            routeDate={route.date}
            visit={visits[next.id] ?? null}
            onMutate={() => reloadVisits(route)}
            highlightArrival={arrivalHighlight}
          />
          <RouteDayTimeline
            todayRoute={route}
            tomorrowRoute={tomorrowRoute}
            tomorrowIso={tomorrowIso}
            visitsToday={visits}
            highlightStopId={arrivalHighlight ? next.id : activeStop?.id}
          />
          <Link href={'/(tabs)/agenda' as Href} asChild>
            <SecondaryButton
              label={H.openFullAgenda}
              tint
              fullWidth
              accessibilityLabel={H.openFullAgendaA11y}
            />
          </Link>
          <PipelineSummaryCard />
          <CommercialHubCard />
          <Surface style={[styles.missionCompact, { borderColor: palette.border }]}>
            <Text style={[typography.caption, { color: palette.textSecondary }]}>{H.currentMission}</Text>
            <Text style={[typography.title, { color: palette.text }]} numberOfLines={1}>
              {missionDef.title}
            </Text>
            <Text style={[typography.caption, { color: palette.textSecondary }]}>
              {H.missionProgress.replace('{current}', String(missionCur)).replace('{target}', String(missionTgt))}
            </Text>
            <Link href={'/(tabs)/more/missions' as Href} asChild>
              <HapticPressable
                style={[styles.ctaOutline, { borderColor: palette.tint }]}
                accessibilityRole="button"
                accessibilityLabel={H.openMissionCenterA11y}>
                <Text style={[styles.ctaOutlineText, { color: palette.tint }]}>{H.viewMissions}</Text>
              </HapticPressable>
            </Link>
          </Surface>
          {pending > 0 || failed > 0 ? <SyncBanner /> : null}
        </>
      )}
    </ScreenChrome>
  );
}

const styles = StyleSheet.create({
  routeBanner: { padding: space.sm, borderRadius: radius.md, borderWidth: 1, gap: space.sm },
  missionCompact: { gap: 6, padding: space.md, shadowOpacity: 0, elevation: 0 },
  sectionHeading: { marginTop: 4, marginBottom: 2 },
  focusHint: { marginTop: -4, marginBottom: 2 },
  ctaOutlineText: { ...typography.buttonSm },
  ctaOutline: {
    marginTop: 4,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: space.md,
    borderRadius: radius.md,
    borderWidth: 1.5,
    minHeight: 48,
  },
  footer: { padding: space.md, borderTopWidth: StyleSheet.hairlineWidth },
  footerText: { ...typography.caption, textAlign: 'center' },
  wideRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: space.lg,
  },
  widePrimary: { flex: 1.15, gap: space.md, minWidth: 0 },
  wideAside: { flex: 0.85, gap: space.md, minWidth: 280 },
});
