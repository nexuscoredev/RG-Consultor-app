/**
 * Espaço reservado sob o conteúdo quando a tab bar flutuante (blur) está ativa.
 * Altura aproximada da barra + margem inferior segura.
 */
export function tabBarFloatingClearance(bottomInset: number): number {
  return 78 + Math.max(bottomInset, 8) + 12;
}

/** Escala de espaçamento (white space) e raios — UX premium RG Consultor */
export const space = {
  xs: 6,
  sm: 10,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const radius = {
  sm: 12,
  md: 18,
  lg: 24,
  xl: 28,
  pill: 9999,
} as const;

/** Sombras suaves (iOS shadow + Android elevation) */
export const shadow = {
  card: {
    shadowColor: '#0d3d24',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 5,
  },
  soft: {
    shadowColor: '#0d3d24',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  lift: {
    shadowColor: '#0d3d24',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.1,
    shadowRadius: 28,
    elevation: 8,
  },
} as const;
