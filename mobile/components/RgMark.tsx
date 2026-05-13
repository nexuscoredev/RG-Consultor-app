import { PHI } from '@/lib/tierVisuals';
import { Image, StyleSheet, useWindowDimensions, View, type ViewStyle } from 'react-native';

const wordmark = require('../assets/images/rg-logo-wordmark.png');

type Props = {
  compact?: boolean;
  /** Logo maior no login e hero screens */
  hero?: boolean;
};

/**
 * Logotipo oficial (PNG). Moldura clara para combinar com o app (antes: fundo preto pesado).
 */
export function RgMark({ compact, hero }: Props) {
  const { width } = useWindowDimensions();
  const heroW = Math.min(width - 40, 400);
  /** Proporção áurea: largura da arte ≈ altura × φ (wordmark horizontal). */
  const w = hero ? heroW : compact ? Math.round(46 * PHI * 4.8) : Math.round(52 * PHI * 4.8);
  const h = hero ? Math.max(50, Math.round(heroW / PHI / 3.2)) : compact ? 46 : 52;

  const padV = hero ? 18 : 12;
  const padH = Math.round(padV * PHI);
  const frameStyle: ViewStyle[] = [styles.frame, { paddingVertical: padV, paddingHorizontal: padH }];
  if (hero) frameStyle.push(styles.frameHero);

  return (
    <View style={frameStyle} accessibilityRole="image" accessibilityLabel="RG Consultor — RG Ambiental">
      <Image source={wordmark} style={{ width: w, height: h }} resizeMode="contain" accessibilityIgnoresInvertColors />
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    alignSelf: 'flex-start',
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#cfe3d6',
    shadowColor: '#1a4d2e',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  frameHero: {
    alignSelf: 'center',
    borderRadius: 18,
    shadowColor: '#1a4d2e',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 8,
  },
});
