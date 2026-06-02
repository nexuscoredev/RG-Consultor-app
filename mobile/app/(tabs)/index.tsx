import { HomePullTip } from '@/components/HomePullTip';
import { CommercialHubCard } from '@/components/home/CommercialHubCard';
import { HomeHeroGlass } from '@/components/home/HomeHeroGlass';
import { MissionProgressBar } from '@/components/home/MissionProgressBar';
import { PipelineSummaryCard } from '@/components/home/PipelineSummaryCard';
import { RouteDayTimeline } from '@/components/home/RouteDayTimeline';
import { RgConsultorLogo } from '@/components/RgConsultorLogo';
import { ScreenChrome } from '@/components/ScreenChrome';
import { StopCard } from '@/components/StopCard';
import { SyncBanner } from '@/components/SyncBanner';
import { Surface } from '@/components/ui/Surface';
import { HapticPressable } from '@/components/ui/HapticPressable';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { radius, space } from '@/constants/layout';
import { typography } from '@/constants/typography';
import { iconSize } from '@/constants/icons';
import { useDemoGps } from '@/context/DemoGpsContext';
import { useGamification } from '@/context/GamificationContext';
import { useSync } from '@/context/SyncContext';
import { fetchRouteDay } from '@/lib/api';
import { distanceMeters } from '@/lib/geo';
import { MISSIONS, tierForXp } from '@/lib/gamificationEngine';
import { t } from '@/lib/i18n';
import {
  addDaysIso,
  getDefaultRouteToday,
  mockMgmtAlerts,
  routeForDate,
  todayIsoDate,
} from '@/lib/mockData';
import { saveRouteToCache } from '@/lib/routesCache';
import { getVisit, type VisitLocal } from '@/lib/visitStore';
import type { RotaDia } from '@rg-ambiental/shared';
import { useFocusEffect } from '@react-navigation/native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import * as Location from 'expo-location';
import { Link, type Href } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View, type PressableStateCallbackType } from 'react-native';

export default function HomeScreen() {
  const scheme = useColorScheme() ?? 'light';
  const palette = Colors[scheme];
  const { pending, failed } = useSync();
  const { simulateAtClient } = useDemoGps();
  const { missions: missionRows, wallet } = useGamification();
  const [route, setRoute] = useState<RotaDia>(() => getDefaultRouteToday());
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

  const tier = useMemo(() => tierForXp(wallet.xp), [wallet.xp]);

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

  const onHomeRefresh = useCallback(async () => {
    try {
      const today = todayIsoDate();
      const fresh = await fetchRouteDay(today);
      saveRouteToCache(fresh);
      setRoute(fresh);
      reloadVisits(fresh);
    } catch {
      const r = getDefaultRouteToday();
      setRoute(r);
      reloadVisits(r);
    }
  }, [reloadVisits]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const today = todayIsoDate();
        const fresh = await fetchRouteDay(today);
        if (cancelled) return;
        saveRouteToCache(fresh);
        setRoute(fresh);
        reloadVisits(fresh);
      } catch {
        if (!cancelled) {
          const r = getDefaultRouteToday();
          setRoute(r);
          reloadVisits(r);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [reloadVisits]);

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
          { accuracy: Location.Accuracy.Balanced, timeInterval: 22000, distanceInterval: 45 },
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
  const progress = missionTgt > 0 ? Math.min(1, missionCur / missionTgt) : 0;
  const H = t('home');

  if (!next) {
    return (
      <ScreenChrome title="" subtitle="">
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
      title=""
      subtitle=""
      onRefresh={onHomeRefresh}
      footer={
        <View style={[styles.footer, { borderTopColor: palette.border, backgroundColor: palette.card }]}>
          <Text style={[styles.footerText, { color: palette.textSecondary }]}>
            {H.footerOutbox.replace('{pending}', String(pending)).replace('{failed}', String(failed))}
          </Text>
        </View>
      }>
      <HomeHeroGlass dateLabel={dateLabel} />

      <HomePullTip />

      <CommercialHubCard />
      <PipelineSummaryCard />

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

      <Surface style={[styles.missionCard, { borderColor: palette.border }]}>
        <View style={styles.statusHead}>
          <View style={[styles.iconBadge, { backgroundColor: `${palette.tint}12` }]}>
            <MaterialCommunityIcons name="target" size={20} color={palette.tint} />
          </View>
          <Text style={[typography.eyebrow, styles.statusEyebrow, { color: palette.textSecondary }]}>{H.currentMission}</Text>
        </View>
        <Text style={[typography.title, styles.statusTitle, { color: palette.text }]} numberOfLines={2}>
          {missionDef.title}
        </Text>
        <MissionProgressBar progress={progress} trackColor={scheme === 'dark' ? 'rgba(255,255,255,0.12)' : '#e5e7eb'} />
        <Text style={[typography.caption, styles.statusMeta, { color: palette.textSecondary }]}>
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

      <View style={styles.statsRow}>
        <View style={[styles.statCard, { backgroundColor: palette.card, borderColor: palette.border }]}>
          <View style={styles.statTop}>
            <View style={[styles.iconBadgeSm, { backgroundColor: `${palette.tint}10` }]}>
              <MaterialCommunityIcons name="chart-timeline-variant" size={18} color={palette.tint} />
            </View>
            <Text style={[styles.statLabel, { color: palette.textSecondary }]}>{H.xp}</Text>
          </View>
          <Text style={[styles.statVal, { color: palette.text }]}>{wallet.xp}</Text>
          <Text style={[styles.statHint, { color: tier.color }]}>{tier.label}</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: palette.card, borderColor: palette.border }]}>
          <View style={styles.statTop}>
            <View style={[styles.iconBadgeSm, { backgroundColor: `${palette.tint}10` }]}>
              <MaterialCommunityIcons name="circle-multiple-outline" size={18} color={palette.tint} />
            </View>
            <Text style={[styles.statLabel, { color: palette.textSecondary }]}>{H.coins}</Text>
          </View>
          <Text style={[styles.statVal, { color: palette.text }]}>{wallet.coins}</Text>
          <Link href={'/(tabs)/more/store' as Href} asChild>
            <HapticPressable
              style={[styles.ctaSolidSm, { backgroundColor: palette.tint }]}
              accessibilityRole="button"
              accessibilityLabel={H.openStoreA11y}>
              <Text style={styles.ctaSolidTextSm}>{H.goStore}</Text>
            </HapticPressable>
          </Link>
        </View>
      </View>

      <SyncBanner />

      <Text style={[typography.sectionLabel, styles.sectionHeading, { color: palette.textSecondary }]}>{H.management}</Text>
      {mockMgmtAlerts.map((a) => (
        <Surface
          key={a.id}
          style={{
            borderColor: a.severity === 'danger' ? palette.danger : palette.border,
            padding: space.md,
            gap: space.sm,
          }}>
          <View style={{ flexDirection: 'row', gap: space.md, alignItems: 'flex-start' }}>
            <MaterialCommunityIcons
              name="bell-outline"
              size={iconSize.sm}
              color={a.severity === 'danger' ? palette.danger : palette.tint}
            />
            <View style={{ flex: 1 }}>
              <Text style={[typography.title, styles.alertTitle, { color: a.severity === 'danger' ? palette.danger : palette.text }]}>
                {a.title}
              </Text>
              <Text style={[typography.body, styles.alertBody, { color: palette.textSecondary }]}>{a.body}</Text>
            </View>
          </View>
        </Surface>
      ))}

      <Link href={'/(tabs)/more/operation' as Href} asChild>
        <HapticPressable
          style={({ pressed }: PressableStateCallbackType) => [
            styles.ctaBanner,
            { backgroundColor: palette.forestDeep, opacity: pressed ? 0.92 : 1 },
          ]}
          accessibilityRole="button"
          accessibilityLabel={H.openShowroomA11y}>
          <MaterialCommunityIcons name="play-circle-outline" size={24} color="#fff" />
          <Text style={styles.ctaText}>{H.operationCta}</Text>
          <MaterialCommunityIcons name="chevron-right" size={iconSize.md} color="#fff" />
        </HapticPressable>
      </Link>
    </ScreenChrome>
  );
}

const styles = StyleSheet.create({
  missionCard: { gap: 10, padding: space.md, shadowOpacity: 0, elevation: 0 },
  sectionHeading: { marginTop: 4, marginBottom: 2 },
  focusHint: { marginTop: -4, marginBottom: 2 },
  statusHead: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconBadge: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusEyebrow: { flex: 1 },
  statusTitle: { letterSpacing: -0.3, lineHeight: 22 },
  statusMeta: {},
  ctaOutlineText: { ...typography.buttonSm },
  statsRow: { flexDirection: 'row', gap: space.md },
  statCard: {
    flex: 1,
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: space.md,
    gap: 6,
    shadowOpacity: 0,
    elevation: 0,
  },
  statTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  iconBadgeSm: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statLabel: { ...typography.eyebrow, flex: 1, letterSpacing: 0.8 },
  statVal: { fontSize: 22, fontWeight: '900', letterSpacing: -0.5 },
  statHint: { ...typography.captionBold },
  ctaSolidSm: {
    marginTop: 6,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: radius.md,
    minHeight: 40,
  },
  ctaSolidTextSm: { color: '#fff', ...typography.buttonSm },
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
  alertTitle: {},
  alertBody: { marginTop: 4 },
  ctaBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 18,
    paddingHorizontal: space.lg,
    borderRadius: radius.lg,
  },
  ctaText: { flex: 1, color: '#fff', ...typography.button },
  footer: { padding: space.md, borderTopWidth: StyleSheet.hairlineWidth },
  footerText: { ...typography.caption, textAlign: 'center' },
});
