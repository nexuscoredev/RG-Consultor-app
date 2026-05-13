import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { TIERS, type TierDef, type TierId } from '@/lib/gamificationEngine';
import { TIER_GRADIENT } from '@/lib/tierVisuals';
import { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

function TierMedal({ tier, active }: { tier: TierDef; active: boolean }) {
  const scheme = useColorScheme() ?? 'light';
  const p = Colors[scheme];
  const [c0, c1] = TIER_GRADIENT[tier.id as TierId];
  const w = 52;
  const h = 58;

  return (
    <View style={[styles.medalWrap, active && styles.medalActive]} accessibilityLabel={`Liga ${tier.label}`}>
      <Svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
        <Defs>
          <LinearGradient id={`lg-${tier.id}`} x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={c0} />
            <Stop offset="1" stopColor={c1} />
          </LinearGradient>
        </Defs>
        <Rect
          x="4"
          y="4"
          width={w - 8}
          height={h - 14}
          rx="14"
          fill={`url(#lg-${tier.id})`}
          stroke={active ? p.tint : 'rgba(255,255,255,0.35)'}
          strokeWidth={active ? 2.5 : 1}
        />
        <Rect x="16" y={h - 12} width={w - 32} height="8" rx="3" fill={c1} opacity={0.85} />
      </Svg>
      <Text style={[styles.medalLabel, { color: active ? p.tint : p.textSecondary }]} numberOfLines={1}>
        {tier.label}
      </Text>
    </View>
  );
}

function TierLeagueStripInner({ currentId }: { currentId: TierId }) {
  return (
    <View style={styles.row}>
      {TIERS.map((t) => (
        <TierMedal key={t.id} tier={t} active={t.id === currentId} />
      ))}
    </View>
  );
}

export const TierLeagueStrip = memo(TierLeagueStripInner);

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    gap: 4,
    paddingVertical: 8,
  },
  medalWrap: { flex: 1, alignItems: 'center', opacity: 0.72, minWidth: 56 },
  medalActive: { opacity: 1 },
  medalLabel: { fontSize: 9, fontWeight: '800', marginTop: 4, textAlign: 'center', letterSpacing: 0.3 },
});
