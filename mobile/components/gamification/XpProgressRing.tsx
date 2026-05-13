import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

type Props = {
  /** 0–1 progresso até o próximo nível */
  progress: number;
  /** XP atual (centro) */
  xpLabel: string;
  /** Subtítulo (ex.: nome da liga) */
  subtitle: string;
  accentColor: string;
};

const SIZE = 132;
const STROKE = 9;
const R = (SIZE - STROKE) / 2;
const C = 2 * Math.PI * R;

function XpProgressRingInner({ progress, xpLabel, subtitle, accentColor }: Props) {
  const scheme = useColorScheme() ?? 'light';
  const p = Colors[scheme];
  const clamped = Math.max(0, Math.min(1, progress));
  const dashOffset = C * (1 - clamped);

  return (
    <View style={styles.wrap} accessibilityRole="progressbar" accessibilityValue={{ now: clamped, min: 0, max: 1 }}>
      <Svg width={SIZE} height={SIZE} style={styles.svg}>
        <Circle cx={SIZE / 2} cy={SIZE / 2} r={R} stroke={p.border} strokeWidth={STROKE} fill="none" />
        <Circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={R}
          stroke={accentColor}
          strokeWidth={STROKE}
          fill="none"
          strokeDasharray={`${C} ${C}`}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
        />
      </Svg>
      <View style={styles.center} pointerEvents="none">
        <Text style={[styles.xp, { color: p.text }]}>{xpLabel}</Text>
        <Text style={[styles.sub, { color: p.textSecondary }]} numberOfLines={2}>
          {subtitle}
        </Text>
      </View>
    </View>
  );
}

export const XpProgressRing = memo(XpProgressRingInner);

const styles = StyleSheet.create({
  wrap: { width: SIZE, height: SIZE, alignItems: 'center', justifyContent: 'center' },
  svg: { position: 'absolute' },
  center: { alignItems: 'center', justifyContent: 'center', maxWidth: SIZE - 28, gap: 2 },
  xp: { fontSize: 20, fontWeight: '900', letterSpacing: -0.5 },
  sub: { fontSize: 11, fontWeight: '700', textAlign: 'center', textTransform: 'uppercase', letterSpacing: 0.6 },
});
