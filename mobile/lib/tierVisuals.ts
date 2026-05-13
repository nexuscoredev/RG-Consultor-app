import type { TierId } from '@/lib/gamificationEngine';

/** Proporção áurea (layout / molduras) */
export const PHI = (1 + Math.sqrt(5)) / 2;

/** Gradientes metálicos por liga (SVG / UI) */
export const TIER_GRADIENT: Record<TierId, readonly [string, string]> = {
  bronze: ['#fde68a', '#b45309'],
  prata: ['#f1f5f9', '#64748b'],
  ouro: ['#fcd34d', '#ca8a04'],
  platina: ['#99f6e4', '#0d9488'],
  diamante: ['#c7d2fe', '#4f46e5'],
};

export const TIER_SHIMMER: Record<TierId, string> = {
  bronze: 'rgba(180, 83, 9, 0.25)',
  prata: 'rgba(100, 116, 139, 0.2)',
  ouro: 'rgba(202, 138, 4, 0.22)',
  platina: 'rgba(13, 148, 136, 0.2)',
  diamante: 'rgba(99, 102, 241, 0.22)',
};
