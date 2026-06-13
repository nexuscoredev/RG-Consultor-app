import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { SyncBanner } from '@/components/SyncBanner';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { SecondaryButton } from '@/components/ui/SecondaryButton';
import { HapticPressable } from '@/components/ui/HapticPressable';
import { useTabletLayout } from '@/hooks/useTabletLayout';
import { radius, space, tabBarFloatingClearance } from '@/constants/layout';
import { typography } from '@/constants/typography';
import { fetchPipeline } from '@/lib/api';
import {
  acceptanceHref,
  contractHrefFromSession,
  followupHref,
  proposalHrefWithValue,
  prospectingHref,
  visitSessionFromMeta,
  visitSessionHrefFromMeta,
} from '@/lib/commercialLinks';
import { inferPhaseFromStage, type CommercialPhase } from '@/lib/commercialFunnel';
import { t } from '@/lib/i18n';
import {
  loadLocalPipeline,
  mergePipelineRows,
  type PipelineViewRow,
} from '@/lib/localPipelineStore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { Link, type Href } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
  type ListRenderItem,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function isClosedStage(stage: string): boolean {
  return /contrato fechado|contrato ativo/i.test(stage);
}

type PhaseFilter = 'all' | CommercialPhase;

function phaseLabel(phase: CommercialPhase): string {
  const PL = t('pipeline');
  switch (phase) {
    case 'prospecting':
      return PL.phaseProspecting;
    case 'proposal':
      return PL.phaseProposal;
    case 'acceptance':
      return PL.phaseAcceptance;
    case 'contract':
      return PL.phaseContract;
  }
}

const CACHE_KEY = 'rg_pipeline_cache_v1';

function PipelineCard({ row, palette: p }: { row: PipelineViewRow; palette: (typeof Colors)['light'] }) {
  const PL = t('pipeline');
  const phase = inferPhaseFromStage(row.stage);
  const { isTablet } = useTabletLayout();
  const session = visitSessionFromMeta(row.account, {
    routeDate: row.routeDate,
    stopId: row.stopId,
    contact: row.contact,
    address: row.address,
    city: row.city,
    phone: row.phone,
  });

  return (
    <View
      style={[
        styles.card,
        isTablet && styles.cardTablet,
        { backgroundColor: p.card, borderColor: p.border },
      ]}>
      <View style={styles.cardHead}>
        <Text style={[typography.title, styles.account, { color: p.text }]}>{row.account}</Text>
        <View style={styles.badges}>
          <View style={[styles.badge, { backgroundColor: `${p.tint}18` }]}>
            <Text style={[typography.meta, styles.badgeText, { color: p.tint }]}>{phaseLabel(phase)}</Text>
          </View>
          {row.source === 'local' ? (
            <View style={[styles.badge, { backgroundColor: `${p.textSecondary}18` }]}>
              <Text style={[typography.meta, styles.badgeText, { color: p.textSecondary }]}>{PL.badgeLocal}</Text>
            </View>
          ) : null}
        </View>
      </View>
      <Text style={[typography.bodyBold, styles.stage, { color: p.tint }]}>{row.stage}</Text>
      {row.proposalNumber ? (
        <Text style={[typography.caption, { color: p.textSecondary }]}>
          {PL.proposalRef}: {row.proposalNumber}
        </Text>
      ) : null}
      {row.docPending ? (
        <Text style={[typography.captionBold, styles.doc, { color: p.danger }]}>
          {PL.docPrefix} {row.docPending}
        </Text>
      ) : null}
      <View style={styles.row}>
        <Text style={[typography.caption, { color: p.textSecondary }]}>{row.owner}</Text>
        <Text style={[typography.caption, { color: p.textSecondary }]}>{row.value}</Text>
      </View>
      <View style={styles.actions}>
        <Link href={visitSessionHrefFromMeta(row.account, session)} asChild style={styles.fullBtn}>
          <PrimaryButton fullWidth label={PL.actionVisit} accessibilityLabel={PL.actionVisit} />
        </Link>
        {phase === 'prospecting' ? (
          <Link href={prospectingHref(row.account)} asChild style={styles.halfBtn}>
            <SecondaryButton fullWidth label={PL.actionProspecting} accessibilityLabel={PL.actionProspecting} />
          </Link>
        ) : null}
        {phase === 'proposal' ? (
          <>
            <Link
              href={proposalHrefWithValue({
                company: row.account,
                clientName: row.contact,
                value: row.value,
                stopId: row.stopId ?? row.id,
                routeDate: row.routeDate,
              })}
              asChild
              style={styles.halfBtn}>
              <SecondaryButton fullWidth label={PL.actionProposal} accessibilityLabel={PL.actionProposal} />
            </Link>
            <Link
              href={followupHref(row.contact || row.account, row.account, row.phone, session)}
              asChild
              style={styles.halfBtn}>
              <SecondaryButton fullWidth label={PL.actionFollowup} accessibilityLabel={PL.actionFollowup} />
            </Link>
          </>
        ) : null}
        {phase === 'acceptance' ? (
          <Link
            href={acceptanceHref({
              company: row.account,
              proposalNumber: row.proposalNumber,
              clientName: row.contact,
              value: row.value,
              phone: row.phone,
            })}
            asChild
            style={styles.fullBtn}>
            <PrimaryButton fullWidth label={PL.actionAcceptance} accessibilityLabel={PL.actionAcceptance} />
          </Link>
        ) : null}
        {(phase === 'contract' || (phase === 'acceptance' && !isClosedStage(row.stage))) && !isClosedStage(row.stage) ? (
          <Link href={contractHrefFromSession(session, row.value)} asChild style={styles.fullBtn}>
            <PrimaryButton fullWidth label={PL.actionContract} accessibilityLabel={PL.actionContract} />
          </Link>
        ) : null}
      </View>
    </View>
  );
}

export default function PipelineScreen() {
  const p = Colors[useColorScheme() ?? 'light'];
  const PL = t('pipeline');
  const insets = useSafeAreaInsets();
  const pad = tabBarFloatingClearance(insets.bottom);
  const { horizontalPadding, isTablet, contentMaxWidth, touchMinHeight, cardColumns } = useTabletLayout();
  const [rows, setRows] = useState<PipelineViewRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [source, setSource] = useState<'live' | 'cache'>('live');
  const [phaseFilter, setPhaseFilter] = useState<PhaseFilter>('all');

  const visibleRows = useMemo(() => {
    if (phaseFilter === 'all') return rows;
    return rows.filter((r) => inferPhaseFromStage(r.stage) === phaseFilter);
  }, [rows, phaseFilter]);

  const load = useCallback(async (opts?: { silent?: boolean }) => {
    if (!opts?.silent) setLoading(true);
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
      if (!opts?.silent) setLoading(false);
    }
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await load({ silent: true });
    } finally {
      setRefreshing(false);
    }
  }, [load]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const renderItem: ListRenderItem<PipelineViewRow> = useCallback(
    ({ item }) => (
      <View style={cardColumns > 1 ? styles.cardCell : styles.cardFull}>
        <PipelineCard row={item} palette={p} />
      </View>
    ),
    [cardColumns, p],
  );

  const listHeader = useMemo(
    () => (
      <View style={styles.header}>
        <SyncBanner />
        <Text style={[typography.caption, styles.banner, { color: p.textSecondary }]}>
          {source === 'live' ? PL.sourceLive : PL.sourceCache}
        </Text>
        <Text style={[typography.caption, styles.hint, { color: p.textSecondary }]}>{PL.integratedHint}</Text>
        <View style={styles.filters}>
          {(['all', 'prospecting', 'proposal', 'acceptance', 'contract'] as PhaseFilter[]).map((f) => {
            const on = phaseFilter === f;
            const label = f === 'all' ? PL.filterAll : phaseLabel(f);
            return (
              <HapticPressable
                key={f}
                onPress={() => setPhaseFilter(f)}
                style={[
                  styles.filterChip,
                  isTablet && styles.filterChipTablet,
                  {
                    borderColor: p.border,
                    backgroundColor: on ? `${p.tint}22` : p.card,
                    minHeight: touchMinHeight,
                  },
                ]}>
                <Text
                  style={[
                    typography.captionBold,
                    isTablet && typography.body,
                    { color: on ? p.tint : p.textSecondary },
                  ]}>
                  {label}
                </Text>
              </HapticPressable>
            );
          })}
        </View>
        {loading ? <ActivityIndicator color={p.tint} style={styles.loader} /> : null}
      </View>
    ),
    [PL, isTablet, loading, p, phaseFilter, source, touchMinHeight],
  );

  const listEmpty = useMemo(() => {
    if (loading) return null;
    const isFilter = phaseFilter !== 'all' && rows.length > 0;
    return (
      <View style={styles.emptyWrap}>
        <Text style={[typography.body, styles.empty, { color: p.textSecondary }]}>
          {isFilter ? PL.filterEmpty : PL.empty}
        </Text>
        {!isFilter ? (
          <Link href={'/(tabs)/commercial/clients?new=1' as Href} asChild>
            <PrimaryButton fullWidth label={t('clients').add} />
          </Link>
        ) : (
          <HapticPressable onPress={() => setPhaseFilter('all')} style={[styles.filterChip, { borderColor: p.tint }]}>
            <Text style={[typography.captionBold, { color: p.tint }]}>{PL.filterAll}</Text>
          </HapticPressable>
        )}
      </View>
    );
  }, [PL.empty, PL.filterAll, PL.filterEmpty, loading, p.textSecondary, p.tint, phaseFilter, rows.length]);

  return (
    <FlatList
      data={visibleRows}
      key={`pipeline-${cardColumns}`}
      keyExtractor={(r) => r.id}
      numColumns={cardColumns}
      columnWrapperStyle={cardColumns > 1 ? styles.cardRow : undefined}
      renderItem={renderItem}
      ListHeaderComponent={listHeader}
      ListEmptyComponent={listEmpty}
      contentContainerStyle={[
        styles.root,
        {
          backgroundColor: p.background,
          paddingBottom: pad,
          paddingHorizontal: horizontalPadding,
          paddingTop: space.lg,
          alignSelf: 'center',
          maxWidth: isTablet ? contentMaxWidth : undefined,
          width: '100%',
        },
      ]}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => void onRefresh()}
          tintColor={p.tint}
          colors={[p.tint, p.forestDeep]}
          progressBackgroundColor={p.card}
        />
      }
      initialNumToRender={8}
      maxToRenderPerBatch={6}
      windowSize={7}
      removeClippedSubviews
    />
  );
}

const styles = StyleSheet.create({
  root: { gap: space.md },
  header: { gap: space.xs },
  empty: { textAlign: 'center', marginTop: space.lg, paddingHorizontal: space.sm },
  emptyWrap: { gap: space.md, paddingHorizontal: space.sm, marginTop: space.lg },
  banner: { marginBottom: 4 },
  hint: { marginBottom: space.xs },
  loader: { marginVertical: space.sm },
  card: { borderRadius: radius.md, borderWidth: 1, padding: space.md, gap: space.xs },
  cardFull: { width: '100%', marginBottom: space.md },
  cardCell: { flex: 1, marginBottom: space.md },
  cardRow: { gap: space.md },
  cardTablet: { padding: space.lg },
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  filterChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: radius.sm, borderWidth: 1, justifyContent: 'center' },
  filterChipTablet: { paddingHorizontal: 16, paddingVertical: 10 },
  cardHead: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: space.sm },
  account: { flex: 1 },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, justifyContent: 'flex-end' },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.sm },
  badgeText: { textTransform: 'uppercase' },
  stage: {},
  doc: {},
  row: { flexDirection: 'row', justifyContent: 'space-between', marginTop: space.xs },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, marginTop: space.sm },
  halfBtn: { flexBasis: '48%', flexGrow: 1 },
  fullBtn: { flexBasis: '100%', width: '100%' },
});
