import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { SecondaryButton } from '@/components/ui/SecondaryButton';
import { radius, screenScroll, space, tabBarFloatingClearance } from '@/constants/layout';
import { typography } from '@/constants/typography';
import { fetchPipeline } from '@/lib/api';
import {
  contractHrefFromSession,
  followupHref,
  proposalHrefWithValue,
} from '@/lib/commercialLinks';
import { t } from '@/lib/i18n';
import {
  loadLocalPipeline,
  mergePipelineRows,
  type PipelineViewRow,
} from '@/lib/localPipelineStore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { Link } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function isClosedStage(stage: string): boolean {
  return /contrato fechado|contrato ativo/i.test(stage);
}

const CACHE_KEY = 'rg_pipeline_cache_v1';

export default function PipelineScreen() {
  const p = Colors[useColorScheme() ?? 'light'];
  const PL = t('pipeline');
  const insets = useSafeAreaInsets();
  const pad = tabBarFloatingClearance(insets.bottom);
  const [rows, setRows] = useState<PipelineViewRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState<'live' | 'cache'>('live');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [apiData, local] = await Promise.all([fetchPipeline(), loadLocalPipeline()]);
      const merged = mergePipelineRows(apiData, local);
      setRows(merged);
      setSource('live');
      await AsyncStorage.setItem(CACHE_KEY, JSON.stringify({ at: Date.now(), rows: merged }));
    } catch {
      const raw = await AsyncStorage.getItem(CACHE_KEY);
      const local = await loadLocalPipeline();
      if (raw) {
        const parsed = JSON.parse(raw) as { rows: PipelineViewRow[] };
        setRows(mergePipelineRows(parsed.rows.filter((r) => r.source === 'api'), local));
      } else {
        setRows(mergePipelineRows([], local));
      }
      setSource('cache');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  return (
    <ScrollView
      contentContainerStyle={[
        styles.root,
        screenScroll,
        { backgroundColor: p.background, paddingBottom: pad },
      ]}
      showsVerticalScrollIndicator={false}>
      <Text style={[typography.caption, styles.banner, { color: p.textSecondary }]}>
        {source === 'live' ? PL.sourceLive : PL.sourceCache}
      </Text>
      <Text style={[typography.caption, styles.hint, { color: p.textSecondary }]}>{PL.integratedHint}</Text>
      {loading ? <ActivityIndicator color={p.tint} /> : null}
      {!loading && rows.length === 0 ? (
        <Text style={[typography.body, styles.empty, { color: p.textSecondary }]}>{PL.empty}</Text>
      ) : null}
      {rows.map((r) => (
        <View key={r.id} style={[styles.card, { backgroundColor: p.card, borderColor: p.border }]}>
          <View style={styles.cardHead}>
            <Text style={[typography.title, styles.account, { color: p.text }]}>{r.account}</Text>
            {r.source === 'local' ? (
              <View style={[styles.badge, { backgroundColor: `${p.tint}18` }]}>
                <Text style={[typography.meta, styles.badgeText, { color: p.tint }]}>{PL.badgeLocal}</Text>
              </View>
            ) : null}
          </View>
          <Text style={[typography.bodyBold, styles.stage, { color: p.tint }]}>{r.stage}</Text>
          {r.proposalNumber ? (
            <Text style={[typography.caption, { color: p.textSecondary }]}>
              {PL.proposalRef}: {r.proposalNumber}
            </Text>
          ) : null}
          {r.docPending ? (
            <Text style={[typography.captionBold, styles.doc, { color: p.danger }]}>
              {PL.docPrefix} {r.docPending}
            </Text>
          ) : null}
          <View style={styles.row}>
            <Text style={[typography.caption, { color: p.textSecondary }]}>{r.owner}</Text>
            <Text style={[typography.caption, { color: p.textSecondary }]}>{r.value}</Text>
          </View>
          <View style={styles.actions}>
            <Link href={followupHref(r.account, r.account)} asChild style={styles.halfBtn}>
              <SecondaryButton
                fullWidth
                label={PL.actionFollowup}
                accessibilityLabel={PL.actionFollowup}
              />
            </Link>
            <Link
              href={proposalHrefWithValue({ company: r.account, value: r.value, stopId: r.id })}
              asChild
              style={styles.halfBtn}>
              <SecondaryButton
                fullWidth
                label={PL.actionProposal}
                accessibilityLabel={PL.actionProposal}
              />
            </Link>
            {!isClosedStage(r.stage) ? (
              <Link
                href={contractHrefFromSession(
                  { routeDate: '', stopId: r.id, company: r.account, contact: '', address: '', city: '' },
                  r.value,
                )}
                asChild
                style={styles.fullBtn}>
                <PrimaryButton
                  fullWidth
                  label={PL.actionContract}
                  accessibilityLabel={PL.actionContract}
                />
              </Link>
            ) : null}
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { gap: space.md },
  empty: { textAlign: 'center', marginTop: space.lg, paddingHorizontal: space.sm },
  banner: { marginBottom: 4 },
  hint: { marginBottom: space.xs },
  card: { borderRadius: radius.md, borderWidth: 1, padding: space.md, gap: space.xs },
  cardHead: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: space.sm },
  account: { flex: 1 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.sm },
  badgeText: { textTransform: 'uppercase' },
  stage: {},
  doc: {},
  row: { flexDirection: 'row', justifyContent: 'space-between', marginTop: space.xs },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, marginTop: space.sm },
  halfBtn: { flexBasis: '48%', flexGrow: 1 },
  fullBtn: { flexBasis: '100%', width: '100%' },
});
