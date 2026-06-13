import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useTabletLayout } from '@/hooks/useTabletLayout';
import { space } from '@/constants/layout';
import { useMemo } from 'react';
import { Image, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

/** Logotipo RG Ambiental (fundo removido) */
const rgAmbientalWordmark = require('../assets/images/rg-ambiental-logo.png');

type Props = {
  subtitle?: string;
  /** compact = linha; hero = login; home = página inicial (destaque central) */
  variant?: 'compact' | 'hero' | 'home';
};

/**
 * Marca RG — home usa logotipo RG Ambiental (PNG); demais variantes mantêm monograma.
 */
export function RgConsultorLogo({ subtitle = 'Campo comercial inteligente', variant = 'compact' }: Props) {
  const scheme = useColorScheme() ?? 'light';
  const p = Colors[scheme];
  const { width: screenW } = useWindowDimensions();
  const { isTablet } = useTabletLayout();
  const hero = variant === 'hero';
  const home = variant === 'home';
  const box = hero ? 68 : 54;
  const consultorSize = hero ? 34 : 27;
  const rgMonoSize = hero ? 22 : 17;
  const gradId = useMemo(() => `rgMonoGrad-${variant}-${box}`, [variant, box]);

  /** Proporção real do wordmark (1024×152) */
  const ambientalAspect = 152 / 1024;
  const ambientalLogoW = Math.min(screenW - space.md * 4, isTablet ? 420 : 320);
  const ambientalLogoH = Math.max(40, Math.round(ambientalLogoW * ambientalAspect));

  if (home) {
    return (
      <View style={styles.homeWrap} accessibilityRole="header" accessibilityLabel="RG Ambiental">
        <Image
          source={rgAmbientalWordmark}
          style={{ width: ambientalLogoW, height: ambientalLogoH }}
          resizeMode="contain"
          accessibilityIgnoresInvertColors
        />
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
          <View style={styles.svgFill}>
            <Svg width={box} height={box}>
              <Defs>
                <LinearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
                  <Stop offset="0" stopColor={p.tint} />
                  <Stop offset="1" stopColor={p.lime} />
                </LinearGradient>
              </Defs>
              <Rect x={0} y={0} width={box} height={box} rx={hero ? 18 : 14} fill={`url(#${gradId})`} />
            </Svg>
          </View>
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
    paddingTop: space.sm,
    paddingBottom: space.xs,
    gap: space.md,
  },
  homeSub: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    fontWeight: '500',
    maxWidth: 320,
  },
});
