import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { TierLeagueStrip } from '@/components/gamification/TierLeagueStrip';
import { XpProgressRing } from '@/components/gamification/XpProgressRing';
import { HapticPressable } from '@/components/ui/HapticPressable';
import { Surface } from '@/components/ui/Surface';
import { useGamification } from '@/context/GamificationContext';
import { isDemoToolsEnabled } from '@/lib/demoTools';
import { usePrefs } from '@/context/PrefsContext';
import {
  leaderboardFor,
  MISSIONS,
  nextTier,
  TIERS,
  tierForXp,
  type LeaderRow,
  type MissionCategory,
  type TierId,
} from '@/lib/gamificationEngine';
import { missionRulesCopy } from '@/lib/mockData';
import { radius, space, tabBarFloatingClearance } from '@/constants/layout';
import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function tierAccent(id: TierId): string {
  return TIERS.find((t) => t.id === id)?.color ?? '#0a5c3d';
}

function displayName(row: LeaderRow, alias: string): string {
  return row.name === 'Você' ? alias : row.name;
}

function initialsFrom(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const a = parts[0]?.[0] ?? '?';
  const b = parts[1]?.[0] ?? '';
  return (a + b).toUpperCase();
}

function PodiumBlock({
  top3,
  alias,
  p,
}: {
  top3: LeaderRow[];
  alias: string;
  p: (typeof Colors)['light'];
}) {
  if (top3.length < 3) return null;
  const first = top3[0];
  const second = top3[1];
  const third = top3[2];
  const slots = [
    { row: second, h: 118, label: '2º' },
    { row: first, h: 148, label: '1º' },
    { row: third, h: 102, label: '3º' },
  ] as const;
  return (
    <View style={styles.podiumRow}>
      {slots.map(({ row, h, label }) => {
        const nm = displayName(row, alias);
        const elite = label === '1º';
        return (
          <View key={row.rank} style={[styles.podiumCol, { height: h + 52 }]}>
            <View
              style={[
                styles.podiumAvatar,
                {
                  borderColor: elite ? p.goldMatte : tierAccent(row.tier),
                  backgroundColor: elite ? `${p.goldMatte}22` : `${tierAccent(row.tier)}18`,
                },
              ]}>
              <Text style={[styles.podiumInitial, { color: elite ? p.forestDeep : p.text }]}>{initialsFrom(nm)}</Text>
            </View>
            <Text style={[styles.podiumName, { color: p.text }]} numberOfLines={1}>
              {nm}
            </Text>
            <Text style={[styles.podiumXp, { color: p.tint }]}>{row.xp} XP</Text>
            <View style={[styles.podiumBase, { height: h, backgroundColor: elite ? `${p.goldMatte}35` : `${p.tint}22` }]}>
              <Text style={[styles.podiumRank, { color: elite ? p.forestDeep : p.text }]}>{label}</Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

function categoryLabel(c: MissionCategory): string {
  switch (c) {
    case 'visits':
      return 'Visitas';
    case 'pipeline':
      return 'Pipeline';
    case 'contracts':
      return 'Contratos';
    case 'revenue':
      return 'Receita';
  }
}

type BoardScope = 'perfil' | 'regiao_sp' | 'nacional';

const scopeLabels: Record<BoardScope, string> = {
  perfil: 'Por perfil',
  regiao_sp: 'Região SP',
  nacional: 'Nacional',
};

export default function MissionsScreen() {
  const p = Colors[useColorScheme() ?? 'light'];
  const insets = useSafeAreaInsets();
  const scrollBottom = tabBarFloatingClearance(insets.bottom);
  const { wallet, missions, demoAdvance } = useGamification();
  const showDemoAdvance = isDemoToolsEnabled();
  const { prefs } = usePrefs();
  const [boardScope, setBoardScope] = useState<BoardScope>('perfil');

  const tier = useMemo(() => tierForXp(wallet.xp), [wallet.xp]);
  const nxt = useMemo(() => nextTier(tier), [tier]);
  const tierProgress = useMemo(() => {
    if (!nxt) return 1;
    const span = nxt.minXp - tier.minXp;
    if (span <= 0) return 1;
    return Math.min(1, (wallet.xp - tier.minXp) / span);
  }, [nxt, tier, wallet.xp]);

  const missionMap = useMemo(() => new Map(missions.map((m) => [m.missionId, m])), [missions]);
  const board = useMemo(() => leaderboardFor(boardScope, wallet.xp), [boardScope, wallet.xp]);

  const top3 = board.length >= 3 ? board.slice(0, 3) : [];
  const tail = board.length > 3 ? board.slice(3) : board.length > 0 && board.length < 3 ? board : [];

  return (
    <ScrollView
      contentContainerStyle={[styles.root, { backgroundColor: p.background, paddingBottom: scrollBottom }]}
      showsVerticalScrollIndicator={false}>
      <Text style={[styles.pageEyebrow, { color: p.textSecondary }]}>Mission Center</Text>
      <Text style={[styles.pageTitle, { color: p.text }]}>Impacto e progresso</Text>
      <Text style={[styles.pageSub, { color: p.textSecondary }]}>
        Metas em missões claras — cada avanço reforça reputação e recompensas.
      </Text>

      <Surface elevated style={styles.heroSurface}>
        <View style={styles.heroRow}>
          <XpProgressRing
            progress={tierProgress}
            xpLabel={`${wallet.xp} XP`}
            subtitle={nxt ? `${tier.label} → ${nxt.label}` : `${tier.label} · topo`}
            accentColor={tier.color}
          />
          <View style={styles.heroCopy}>
            <Text style={[styles.coinsLine, { color: p.tint }]}>
              {wallet.coins} <Text style={{ color: p.textSecondary, fontWeight: '600' }}>moedas disponíveis</Text>
            </Text>
            {nxt ? (
              <Text style={[styles.nextCopy, { color: p.textSecondary }]}>
                Próxima liga <Text style={{ fontWeight: '800', color: p.text }}>{nxt.label}</Text> a partir de{' '}
                {nxt.minXp} XP.
              </Text>
            ) : (
              <Text style={[styles.nextCopy, { color: p.textSecondary }]}>Você está no ápice das ligas RG.</Text>
            )}
          </View>
        </View>
        <Text style={[styles.stripLabel, { color: p.textSecondary }]}>Ligas</Text>
        <TierLeagueStrip currentId={tier.id} />
      </Surface>

      <Text style={[styles.section, { color: p.textSecondary }]}>Regras</Text>
      <Surface style={{ paddingVertical: space.md, gap: space.sm }}>
        {missionRulesCopy.map((line) => (
          <Text key={line} style={[styles.rule, { color: p.text }]}>
            {line}
          </Text>
        ))}
      </Surface>

      <Text style={[styles.section, { color: p.textSecondary }]}>Missões da semana</Text>
      {MISSIONS.map((def) => {
        const st = missionMap.get(def.id);
        const cur = st?.current ?? 0;
        const tgt = st?.target ?? def.target;
        const prog = tgt > 0 ? Math.min(1, cur / tgt) : 0;
        const done = st?.completed;
        return (
          <Surface key={def.id} elevated={!done} style={styles.missionCard}>
            <View style={styles.cardTop}>
              <Text style={[styles.cat, { color: p.tint }]}>{categoryLabel(def.category)}</Text>
              {done ? (
                <View style={[styles.doneBadge, { borderColor: p.lime, backgroundColor: `${p.lime}14` }]}>
                  <Text style={[styles.doneBadgeText, { color: p.tint }]}>Concluída</Text>
                </View>
              ) : showDemoAdvance ? (
                <HapticPressable
                  onPress={() => demoAdvance(def.id, 1)}
                  style={[styles.demoBtn, { borderColor: p.border, backgroundColor: p.background }]}
                  accessibilityLabel={`Simular progresso na missão ${def.title}`}>
                  <Text style={[styles.demoBtnText, { color: p.textSecondary }]}>+1 demo</Text>
                </HapticPressable>
              ) : null}
            </View>
            <Text style={[styles.title, { color: p.text }]}>{def.title}</Text>
            <Text style={[styles.desc, { color: p.textSecondary }]}>{def.description}</Text>
            <View style={[styles.barTrack, { backgroundColor: p.border }]}>
              <View style={[styles.barFill, { width: `${prog * 100}%`, backgroundColor: p.tint }]} />
            </View>
            <Text style={[styles.meta, { color: p.textSecondary }]}>
              {cur} / {tgt}
              {def.category === 'revenue' ? ' mil R$' : ''} · +{def.xpReward} XP · +{def.coinReward} moedas
            </Text>
          </Surface>
        );
      })}

      <Text style={[styles.section, { color: p.textSecondary }]}>Ranking</Text>
      <View style={styles.scopeRow}>
        {(Object.keys(scopeLabels) as BoardScope[]).map((key) => (
          <HapticPressable
            key={key}
            onPress={() => setBoardScope(key)}
            style={[
              styles.scopeChip,
              {
                borderColor: boardScope === key ? p.tint : p.border,
                backgroundColor: boardScope === key ? `${p.tint}18` : p.card,
              },
            ]}
            accessibilityRole="button"
            accessibilityState={{ selected: boardScope === key }}>
            <Text style={[styles.scopeChipText, { color: boardScope === key ? p.tint : p.text }]}>
              {scopeLabels[key]}
            </Text>
          </HapticPressable>
        ))}
      </View>

      {!prefs.rankingOptIn ? (
        <Text style={[styles.meta, { color: p.textSecondary, marginTop: space.sm }]}>
          Ranking oculto — ative em Configurações (opt-in e pseudônimo).
        </Text>
      ) : (
        <Surface elevated style={{ marginTop: space.sm, gap: space.md }}>
          <Text style={[styles.meta, { color: p.textSecondary }]}>
            Exibindo como: <Text style={{ fontWeight: '800', color: p.tint }}>{prefs.leaderboardAlias}</Text>
          </Text>
          {top3.length >= 3 ? (
            <>
              <Text style={[styles.podiumEyebrow, { color: p.textSecondary }]}>Pódio da semana</Text>
              <PodiumBlock top3={top3} alias={prefs.leaderboardAlias} p={p} />
            </>
          ) : null}
          {tail.map((e) => (
            <View key={`${e.rank}-${e.name}`} style={styles.rankRow}>
              <Text style={[styles.rank, { color: p.textSecondary }]}>#{e.rank}</Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.rankName, { color: p.text }]}>{displayName(e, prefs.leaderboardAlias)}</Text>
                <Text style={[styles.rankProfile, { color: p.textSecondary }]}>{e.profile}</Text>
              </View>
              <Text style={[styles.rankPts, { color: p.tint }]}>{e.xp} XP</Text>
            </View>
          ))}
        </Surface>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: {
    paddingHorizontal: space.lg,
    paddingTop: space.lg,
    gap: space.lg,
    paddingBottom: space.xl,
  },
  podiumEyebrow: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  podiumRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'flex-end', gap: space.sm, paddingTop: space.md },
  podiumCol: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', gap: 6, maxWidth: 120 },
  podiumAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  podiumInitial: { fontSize: 18, fontWeight: '900' },
  podiumName: { fontSize: 12, fontWeight: '800', textAlign: 'center', width: '100%' },
  podiumXp: { fontSize: 11, fontWeight: '800' },
  podiumBase: {
    width: '100%',
    borderTopLeftRadius: radius.md,
    borderTopRightRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  podiumRank: { fontSize: 16, fontWeight: '900' },
  pageEyebrow: { fontSize: 11, fontWeight: '900', letterSpacing: 2, textTransform: 'uppercase' },
  pageTitle: { fontSize: 30, fontWeight: '900', letterSpacing: -0.8, marginTop: 4 },
  pageSub: { fontSize: 15, lineHeight: 22, marginTop: 6 },
  heroSurface: { padding: space.xl },
  heroRow: { flexDirection: 'row', gap: space.lg, alignItems: 'center' },
  heroCopy: { flex: 1, gap: space.sm },
  coinsLine: { fontSize: 22, fontWeight: '900' },
  nextCopy: { fontSize: 14, lineHeight: 20 },
  stripLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    marginTop: space.lg,
    marginBottom: 4,
  },
  section: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.6,
    textTransform: 'uppercase',
    marginTop: space.md,
  },
  rule: { fontSize: 14, lineHeight: 22 },
  missionCard: { gap: space.sm, paddingVertical: space.lg },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cat: { fontSize: 10, fontWeight: '900', letterSpacing: 1, textTransform: 'uppercase' },
  doneBadge: {
    paddingHorizontal: space.md,
    paddingVertical: 6,
    borderRadius: radius.pill,
    borderWidth: 1.5,
  },
  doneBadgeText: { fontSize: 12, fontWeight: '900' },
  demoBtn: { paddingHorizontal: space.md, paddingVertical: 8, borderRadius: radius.md, borderWidth: 1 },
  demoBtnText: { fontSize: 12, fontWeight: '800' },
  title: { fontSize: 18, fontWeight: '900', letterSpacing: -0.3 },
  desc: { fontSize: 14, lineHeight: 21 },
  meta: { fontSize: 13, lineHeight: 19 },
  barTrack: { height: 8, borderRadius: radius.pill, overflow: 'hidden', marginTop: 4 },
  barFill: { height: '100%', borderRadius: radius.pill },
  scopeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  scopeChip: { paddingHorizontal: space.lg, paddingVertical: 12, borderRadius: radius.pill, borderWidth: 1.5 },
  scopeChipText: { fontSize: 13, fontWeight: '800' },
  rankRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, gap: space.md },
  rank: { width: 40, fontWeight: '900' },
  rankName: { fontSize: 16, fontWeight: '800' },
  rankProfile: { fontSize: 12, marginTop: 2 },
  rankPts: { fontWeight: '900', fontSize: 15 },
});
