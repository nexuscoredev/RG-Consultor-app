import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { HapticPressable } from '@/components/ui/HapticPressable';
import { radius, space } from '@/constants/layout';
import { typography } from '@/constants/typography';
import { visitSessionHref } from '@/lib/commercialLinks';
import { t } from '@/lib/i18n';
import type { VisitLocal } from '@/lib/visitStore';
import type { Parada, RotaDia } from '@rg-ambiental/shared';
import { Link, type Href } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

export type VisitStatus = 'pending' | 'in_progress' | 'done';

export function visitStatusOf(visit: VisitLocal | null | undefined): VisitStatus {
  if (visit?.check_out_at) return 'done';
  if (visit?.check_in_at) return 'in_progress';
  return 'pending';
}

function statusLabel(s: VisitStatus, T: ReturnType<typeof t<'home'>>): string {
  if (s === 'done') return T.timelineDone;
  if (s === 'in_progress') return T.timelineInProgress;
  return T.timelinePending;
}

type Props = {
  todayRoute: RotaDia;
  tomorrowRoute: RotaDia | null;
  tomorrowIso: string;
  visitsToday: Record<string, VisitLocal | null>;
  highlightStopId?: string;
};

function dayTitle(iso: string, kind: 'today' | 'tomorrow', T: ReturnType<typeof t<'home'>>): string {
  if (kind === 'today') return T.timelineToday;
  const d = new Date(`${iso}T12:00:00`).toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
  });
  return `${T.timelineTomorrow} · ${d}`;
}

function StopRow({
  stop,
  routeDate,
  visit,
  highlighted,
}: {
  stop: Parada;
  routeDate: string;
  visit: VisitLocal | null;
  highlighted?: boolean;
}) {
  const scheme = useColorScheme() ?? 'light';
  const p = Colors[scheme];
  const T = t('home');
  const status = visitStatusOf(visit);
  const statusColor = status === 'done' ? p.tint : status === 'in_progress' ? p.lime : p.textSecondary;

  return (
    <View
      style={[
        styles.row,
        {
          borderColor: highlighted ? p.lime : p.border,
          backgroundColor: highlighted ? `${p.lime}10` : p.card,
          borderWidth: highlighted ? 2 : 1,
        },
      ]}>
      <View style={styles.rowMain}>
        <Text style={[typography.title, styles.time, { color: p.tint }]}>{stop.windowStart.slice(11, 16)}</Text>
        <View style={{ flex: 1 }}>
          <Text style={[typography.title, styles.name, { color: p.text }]} numberOfLines={1}>
            {stop.accountName}
          </Text>
          <Text style={[typography.caption, styles.addr, { color: p.textSecondary }]} numberOfLines={1}>
            {stop.addressLine}
          </Text>
        </View>
        <Text style={[typography.meta, styles.badge, { color: statusColor, fontWeight: '800' }]}>{statusLabel(status, T)}</Text>
      </View>
      <View style={styles.rowActions}>
        <Link href={`/(tabs)/agenda?date=${routeDate}` as Href} asChild>
          <HapticPressable haptic={false} style={[styles.miniBtn, { borderColor: p.border }]}>
            <Text style={[typography.captionBold, styles.miniBtnText, { color: p.textSecondary }]}>{T.timelineAgenda}</Text>
          </HapticPressable>
        </Link>
        <Link href={visitSessionHref(stop, routeDate)} asChild>
          <HapticPressable haptic={false} style={[styles.miniBtn, { borderColor: p.tint, backgroundColor: `${p.tint}12` }]}>
            <Text style={[typography.captionBold, styles.miniBtnText, { color: p.tint }]}>{T.timelineVisitMode}</Text>
          </HapticPressable>
        </Link>
      </View>
    </View>
  );
}

export function RouteDayTimeline({ todayRoute, tomorrowRoute, tomorrowIso, visitsToday, highlightStopId }: Props) {
  const p = Colors[useColorScheme() ?? 'light'];
  const T = t('home');

  const todayDone = todayRoute.stops.filter((s) => visitStatusOf(visitsToday[s.id]) === 'done').length;
  const todayTotal = todayRoute.stops.length;

  return (
    <View style={styles.wrap}>
      <Text style={[typography.sectionLabel, styles.section, { color: p.textSecondary }]}>{T.timelineSection}</Text>
      <Text style={[typography.h3, styles.dayHead, { color: p.text }]}>{dayTitle(todayRoute.date, 'today', T)}</Text>
      <Text style={[typography.caption, styles.progress, { color: p.textSecondary }]}>
        {T.timelineProgress.replace('{done}', String(todayDone)).replace('{total}', String(todayTotal))}
      </Text>
      {todayRoute.stops.map((s) => (
        <StopRow
          key={s.id}
          stop={s}
          routeDate={todayRoute.date}
          visit={visitsToday[s.id] ?? null}
          highlighted={highlightStopId === s.id}
        />
      ))}

      {tomorrowRoute && tomorrowRoute.stops.length > 0 ? (
        <>
          <Text style={[typography.h3, styles.dayHead, { color: p.text, marginTop: space.md }]}>
            {dayTitle(tomorrowIso, 'tomorrow', T)}
          </Text>
          {tomorrowRoute.stops.map((s) => (
            <StopRow key={s.id} stop={s} routeDate={tomorrowIso} visit={null} />
          ))}
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 8 },
  section: { marginBottom: 2 },
  dayHead: { textTransform: 'capitalize' },
  progress: { marginBottom: 4 },
  row: { borderRadius: radius.md, padding: space.md, gap: 10 },
  rowMain: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  time: { width: 44 },
  name: {},
  addr: { marginTop: 2 },
  badge: { textTransform: 'uppercase', maxWidth: 72, textAlign: 'right' },
  rowActions: { flexDirection: 'row', gap: 8 },
  miniBtn: { flex: 1, paddingVertical: 8, borderRadius: 10, borderWidth: 1, alignItems: 'center' },
  miniBtnText: {},
});
