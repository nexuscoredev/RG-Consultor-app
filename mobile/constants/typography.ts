/** Escala tipográfica corporativa (RN StyleSheet). */
export const type = {
  display: { fontSize: 34, fontWeight: '800' as const, letterSpacing: -1 },
  title: { fontSize: 22, fontWeight: '800' as const, letterSpacing: -0.4 },
  subtitle: { fontSize: 15, fontWeight: '600' as const, lineHeight: 22 },
  body: { fontSize: 15, fontWeight: '500' as const, lineHeight: 22 },
  caption: { fontSize: 12, fontWeight: '600' as const, letterSpacing: 0.3 },
  label: { fontSize: 11, fontWeight: '800' as const, letterSpacing: 1.2, textTransform: 'uppercase' as const },
} as const;
