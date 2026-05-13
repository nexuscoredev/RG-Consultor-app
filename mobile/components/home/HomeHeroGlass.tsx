import Colors from '@/constants/Colors';
import { radius, space } from '@/constants/layout';
import { useColorScheme } from '@/components/useColorScheme';
import { RgConsultorLogo } from '@/components/RgConsultorLogo';
import { BlurView } from 'expo-blur';
import { Platform, StyleSheet, Text, View } from 'react-native';

type Props = {
  dateLabel: string;
};

/**
 * Faixa hero com glassmorphism suave (blur iOS; fallback translúcido Android).
 */
export function HomeHeroGlass({ dateLabel }: Props) {
  const scheme = useColorScheme() ?? 'light';
  const p = Colors[scheme];
  const isDark = scheme === 'dark';

  return (
    <View style={[styles.wrap, { borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(17,24,39,0.06)' }]}>
      <BlurView
        intensity={isDark ? 28 : 36}
        tint={isDark ? 'dark' : 'light'}
        style={[StyleSheet.absoluteFill, styles.blur]}
      />
      <View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFillObject,
          styles.blur,
          {
            backgroundColor:
              Platform.OS === 'android'
                ? isDark
                  ? 'rgba(36,48,40,0.85)'
                  : 'rgba(255,255,255,0.78)'
                : isDark
                  ? 'rgba(0,0,0,0.12)'
                  : 'rgba(255,255,255,0.25)',
          },
        ]}
      />
      <View style={styles.inner}>
        <Text style={[styles.date, { color: p.textSecondary }]}>{dateLabel}</Text>
        <RgConsultorLogo variant="home" subtitle="Sua central do dia — visitas, metas e conteúdo para o cliente." />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: radius.xl,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 2,
  },
  blur: { borderRadius: radius.xl },
  inner: {
    zIndex: 1,
    paddingHorizontal: space.md,
    paddingTop: space.sm,
    paddingBottom: space.lg,
  },
  date: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'capitalize',
    letterSpacing: 0.2,
    marginBottom: 4,
    alignSelf: 'center',
  },
});
