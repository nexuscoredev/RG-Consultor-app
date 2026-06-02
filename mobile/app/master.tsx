import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useAuth } from '@/context/AuthContext';
import { fetchMasterDashboard, type MasterDashboardData } from '@/lib/api';
import { isApiEnabled } from '@/lib/apiConfig';
import { MOCK_SELLER_TEAM } from '@/lib/adminTeamMock';
import { t } from '@/lib/i18n';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const statusPt: Record<(typeof MOCK_SELLER_TEAM)[number]['status'], string> = {
  em_visita: 'Em visita',
  em_rota: 'Em rota',
  sync_ok: 'Sincronizado',
  offline: 'Offline',
};

export default function MasterDashboardScreen() {
  const p = Colors[useColorScheme() ?? 'light'];
  const M = t('master');
  const insets = useSafeAreaInsets();
  const { profile, signOut } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(isApiEnabled());
  const [live, setLive] = useState<MasterDashboardData | null>(null);
  const [source, setSource] = useState<'live' | 'demo'>('demo');

  const load = useCallback(async () => {
    if (!isApiEnabled()) {
      setSource('demo');
      setLive(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await fetchMasterDashboard();
      setLive(data);
      setSource('live');
    } catch {
      setLive(null);
      setSource('demo');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const team = live?.team ?? MOCK_SELLER_TEAM;
  const totalVisits = live?.kpis.visitsWeek ?? team.reduce((a, r) => a + r.visitsWeek, 0);
  const totalContracts = live?.kpis.contractsMonth ?? team.reduce((a, r) => a + r.contractsMonth, 0);
  const avgXp = live?.kpis.avgXp ?? Math.round(team.reduce((a, r) => a + r.xp, 0) / team.length);

  return (
    <View style={[styles.root, { backgroundColor: p.background, paddingTop: insets.top }]}>
      <View style={[styles.topBar, { borderBottomColor: p.border }]}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.brand, { color: p.textSecondary }]}>{M.brand}</Text>
          <Text style={[styles.h1, { color: p.text }]}>{M.title}</Text>
          <Text style={[styles.sub, { color: p.textSecondary }]}>
            {profile?.displayName ?? 'Administrador'} ·{' '}
            {source === 'live' ? M.subtitleLive : M.subtitleDemo}
          </Text>
        </View>
        <Pressable
          onPress={async () => {
            await signOut();
            router.replace('/login');
          }}
          style={[styles.outlineBtn, { borderColor: p.border }]}
          accessibilityLabel={M.signOut}>
          <Text style={[styles.outlineBtnText, { color: p.text }]}>{M.signOut}</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 24 }]}>
        {loading ? <ActivityIndicator color={p.tint} style={{ marginVertical: 12 }} /> : null}

        {source === 'live' && live ? (
          <View style={[styles.liveBanner, { backgroundColor: `${p.tint}12`, borderColor: p.tint }]}>
            <Text style={[styles.liveText, { color: p.tint }]}>
              {M.livePipeline.replace('{n}', String(live.pipelineOpen))}
            </Text>
          </View>
        ) : null}

        <View style={styles.kpiRow}>
          <View style={[styles.kpi, { backgroundColor: p.card, borderColor: p.border }]}>
            <Text style={[styles.kpiVal, { color: p.tint }]}>{totalVisits}</Text>
            <Text style={[styles.kpiLab, { color: p.textSecondary }]}>{M.kpiVisits}</Text>
          </View>
          <View style={[styles.kpi, { backgroundColor: p.card, borderColor: p.border }]}>
            <Text style={[styles.kpiVal, { color: p.lime }]}>{totalContracts}</Text>
            <Text style={[styles.kpiLab, { color: p.textSecondary }]}>{M.kpiContracts}</Text>
          </View>
          <View style={[styles.kpi, { backgroundColor: p.card, borderColor: p.border }]}>
            <Text style={[styles.kpiVal, { color: p.text }]}>{avgXp}</Text>
            <Text style={[styles.kpiLab, { color: p.textSecondary }]}>{M.kpiAvgXp}</Text>
          </View>
        </View>

        <Text style={[styles.section, { color: p.textSecondary }]}>{M.heatTitle}</Text>
        <View style={[styles.heatmapCard, { borderColor: p.border, backgroundColor: p.card }]}>
          <Text style={[styles.heatmapHint, { color: p.textSecondary }]}>{M.heatHint}</Text>
          <View style={styles.heatmapGrid}>
            {Array.from({ length: 24 }).map((_, i) => {
              const opacity = 0.12 + ((i * 7 + i * i) % 11) * 0.065;
              return (
                <View
                  key={String(i)}
                  style={[styles.heatCell, { backgroundColor: p.tint, opacity }]}
                />
              );
            })}
          </View>
        </View>

        <Text style={[styles.section, { color: p.textSecondary }]}>{M.teamSection}</Text>
        {team.map((row) => (
          <View key={row.id} style={[styles.card, { backgroundColor: p.card, borderColor: p.border }]}>
            <View style={styles.cardHead}>
              <Text style={[styles.name, { color: p.text }]}>{row.name}</Text>
              <View style={[styles.pill, { backgroundColor: `${p.tint}22` }]}>
                <Text style={[styles.pillText, { color: p.tint }]}>{statusPt[row.status]}</Text>
              </View>
            </View>
            <Text style={[styles.meta, { color: p.textSecondary }]}>
              {row.profile} · {row.region}
            </Text>
            <View style={styles.statsRow}>
              <Text style={[styles.stat, { color: p.text }]}>XP {row.xp}</Text>
              <Text style={[styles.stat, { color: p.text }]}>Moedas {row.coins}</Text>
              <Text style={[styles.stat, { color: p.textSecondary }]}>Sync {row.lastSyncLabel}</Text>
            </View>
            <Text style={[styles.footerLine, { color: p.textSecondary }]}>
              Visitas {row.visitsWeek}/sem · Propostas {row.proposalsWeek} · Contratos {row.contractsMonth}/mês
            </Text>
          </View>
        ))}

        <View style={[styles.hintBox, { borderColor: p.border, backgroundColor: p.card }]}>
          <Text style={[styles.hintTitle, { color: p.text }]}>{M.webPanelTitle}</Text>
          <Text style={[styles.hintBody, { color: p.textSecondary }]}>{M.webPanelBody}</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingBottom: 16,
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  brand: { fontSize: 11, fontWeight: '800', letterSpacing: 1.4, textTransform: 'uppercase' },
  h1: { fontSize: 26, fontWeight: '900', marginTop: 4, letterSpacing: -0.5 },
  sub: { fontSize: 14, marginTop: 6, lineHeight: 20 },
  outlineBtn: {
    marginTop: 4,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  outlineBtnText: { fontWeight: '800', fontSize: 14 },
  scroll: { padding: 20, gap: 12 },
  liveBanner: { borderWidth: 1, borderRadius: 12, padding: 12 },
  liveText: { fontSize: 13, fontWeight: '800' },
  heatmapCard: { borderRadius: 18, borderWidth: 1, padding: 14, gap: 10 },
  heatmapHint: { fontSize: 12, lineHeight: 17 },
  heatmapGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 5, justifyContent: 'space-between' },
  heatCell: { width: '15%', aspectRatio: 1, borderRadius: 10 },
  kpiRow: { flexDirection: 'row', gap: 10 },
  kpi: { flex: 1, borderRadius: 16, borderWidth: 1, padding: 14, alignItems: 'center' },
  kpiVal: { fontSize: 22, fontWeight: '900' },
  kpiLab: { fontSize: 11, marginTop: 6, textAlign: 'center', fontWeight: '600' },
  section: { fontSize: 12, fontWeight: '900', letterSpacing: 1.2, textTransform: 'uppercase', marginTop: 8 },
  card: { borderRadius: 18, borderWidth: 1, padding: 16, gap: 6 },
  cardHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  name: { fontSize: 17, fontWeight: '800', flex: 1 },
  pill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  pillText: { fontSize: 11, fontWeight: '800' },
  meta: { fontSize: 13 },
  statsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 4 },
  stat: { fontSize: 13, fontWeight: '700' },
  footerLine: { fontSize: 12, marginTop: 4 },
  hintBox: { borderRadius: 16, borderWidth: 1, padding: 16, marginTop: 8 },
  hintTitle: { fontSize: 16, fontWeight: '800', marginBottom: 6 },
  hintBody: { fontSize: 14, lineHeight: 21 },
});
