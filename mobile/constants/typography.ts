import { StyleSheet } from 'react-native';

/** Escala tipográfica RG Consultor — usar com `color` do tema em runtime */
export const fontSize = {
  xs: 10,
  sm: 11,
  md: 12,
  base: 13,
  lg: 14,
  xl: 15,
  xxl: 16,
  title: 17,
  h3: 18,
  h2: 22,
  h1: 28,
} as const;

export const fontWeight = {
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  extrabold: '800' as const,
  black: '900' as const,
};

export const lineHeight = {
  tight: 18,
  normal: 20,
  relaxed: 22,
} as const;

export const typography = StyleSheet.create({
  h1: { fontSize: fontSize.h1, fontWeight: fontWeight.black, letterSpacing: -0.5 },
  h2: { fontSize: fontSize.h2, fontWeight: fontWeight.black, letterSpacing: -0.4 },
  h3: { fontSize: fontSize.h3, fontWeight: fontWeight.extrabold },
  title: { fontSize: fontSize.title, fontWeight: fontWeight.extrabold },
  subtitle: { fontSize: fontSize.xl, lineHeight: lineHeight.relaxed, fontWeight: fontWeight.medium },
  body: { fontSize: fontSize.lg, lineHeight: lineHeight.normal, fontWeight: fontWeight.medium },
  bodyBold: { fontSize: fontSize.lg, lineHeight: lineHeight.normal, fontWeight: fontWeight.bold },
  caption: { fontSize: fontSize.base, lineHeight: lineHeight.tight, fontWeight: fontWeight.medium },
  captionBold: { fontSize: fontSize.base, lineHeight: lineHeight.tight, fontWeight: fontWeight.extrabold },
  meta: { fontSize: fontSize.md, lineHeight: lineHeight.normal, fontWeight: fontWeight.medium },
  eyebrow: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.extrabold,
    letterSpacing: 1.1,
    textTransform: 'uppercase',
  },
  sectionLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.black,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
  },
  button: { fontSize: fontSize.xl, fontWeight: fontWeight.extrabold },
  buttonSm: { fontSize: fontSize.lg, fontWeight: fontWeight.extrabold },
  tabLabel: { fontSize: fontSize.xs, fontWeight: fontWeight.extrabold, letterSpacing: 0.2 },
});
