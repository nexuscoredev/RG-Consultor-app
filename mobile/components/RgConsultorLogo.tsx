import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { space } from '@/constants/layout';
import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

type Props = {
  subtitle?: string;
  /** compact = linha; hero = login; home = página inicial (destaque central) */
  variant?: 'compact' | 'hero' | 'home';
};

/**
 * Logotipo RG Consultor — monograma em gradiente + tipografia; sem PNG.
 */
export function RgConsultorLogo({ subtitle = 'Campo comercial inteligente', variant = 'compact' }: Props) {
  const scheme = useColorScheme() ?? 'light';
  const p = Colors[scheme];
  const hero = variant === 'hero';
  const home = variant === 'home';
  const box = home ? 80 : hero ? 68 : 54;
  const consultorSize = home ? 30 : hero ? 34 : 27;
  const rgMonoSize = home ? 26 : hero ? 22 : 17;
  const gradId = useMemo(() => `rgMonoGrad-${variant}-${box}`, [variant, box]);

  if (home) {
    return (
      <View style={styles.homeWrap} accessibilityRole="header" accessibilityLabel="RG Consultor">
        <View style={[styles.homeMono, { width: box, height: box, borderRadius: 22 }]}>
          <Svg width={box} height={box} style={styles.svgFill}>
            <Defs>
              <LinearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
                <Stop offset="0" stopColor={p.tint} />
                <Stop offset="0.55" stopColor="#10b981" />
                <Stop offset="1" stopColor={p.lime} />
              </LinearGradient>
            </Defs>
            <Rect x={0} y={0} width={box} height={box} rx={20} fill={`url(#${gradId})`} />
            <Circle cx={box * 0.78} cy={box * 0.22} r={box * 0.08} fill="rgba(255,255,255,0.22)" />
          </Svg>
          <View style={styles.monoCenter} pointerEvents="none">
            <Text style={[styles.monoLetters, { fontSize: rgMonoSize }]}>RG</Text>
          </View>
        </View>

        <Text style={styles.homeWordmark} accessibilityRole="text">
          <Text style={[styles.homeRg, { color: p.tint }]}>RG </Text>
          <Text style={[styles.homeConsultor, { color: p.text }]}>Consultor</Text>
        </Text>
        <View style={[styles.homeBar, { backgroundColor: p.lime }]} />
        {subtitle ? (
          <Text style={[styles.homeSub, { color: p.textSecondary }]} numberOfLines={2}>
            {subtitle}
          </Text>
        ) : null}
      </View>
    );
  }

  return (
    <View style={styles.wrap} accessibilityRole="header" accessibilityLabel="RG Consultor">
      <View style={[styles.row, { gap: hero ? space.lg : space.md }]}>
        <View style={[styles.monoOuter, { width: box, height: box, borderRadius: hero ? 20 : 16 }]}>
          <Svg width={box} height={box} style={styles.svgFill}>
            <Defs>
              <LinearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
                <Stop offset="0" stopColor={p.tint} />
                <Stop offset="1" stopColor={p.lime} />
              </LinearGradient>
            </Defs>
            <Rect x={0} y={0} width={box} height={box} rx={hero ? 18 : 14} fill={`url(#${gradId})`} />
          </Svg>
          <View style={styles.monoCenter} pointerEvents="none">
            <Text style={[styles.monoLetters, { fontSize: rgMonoSize }]}>RG</Text>
          </View>
        </View>

        <View style={styles.textCol}>
          <Text style={[styles.consultor, { color: p.text, fontSize: consultorSize }]}>Consultor</Text>
          <View style={[styles.accentBar, { backgroundColor: p.lime }]} />
          {subtitle ? (
            <Text style={[styles.sub, { color: p.textSecondary }]} numberOfLines={2}>
              {subtitle}
            </Text>
          ) : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignSelf: 'stretch' },
  row: { flexDirection: 'row', alignItems: 'center' },
  monoOuter: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    shadowColor: '#0d3d24',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 14,
    elevation: 6,
  },
  svgFill: { ...StyleSheet.absoluteFillObject },
  monoCenter: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monoLetters: {
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: -0.5,
  },
  textCol: { flex: 1, gap: 6, paddingRight: 8 },
  consultor: { fontWeight: '800', letterSpacing: -0.6 },
  accentBar: { width: 48, height: 4, borderRadius: 2 },
  sub: { fontSize: 14, lineHeight: 20, fontWeight: '500', marginTop: 4 },

  homeWrap: {
    alignSelf: 'stretch',
    alignItems: 'center',
    paddingVertical: space.lg,
    gap: space.md,
  },
  homeMono: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    shadowColor: '#065f46',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  homeWordmark: { textAlign: 'center', marginTop: 4 },
  homeRg: { fontSize: 36, fontWeight: '900', letterSpacing: -1.2 },
  homeConsultor: { fontSize: 36, fontWeight: '900', letterSpacing: -1 },
  homeBar: { width: 64, height: 4, borderRadius: 2, marginTop: 4 },
  homeSub: { fontSize: 15, lineHeight: 22, textAlign: 'center', fontWeight: '500', maxWidth: 320, marginTop: 6 },
});
