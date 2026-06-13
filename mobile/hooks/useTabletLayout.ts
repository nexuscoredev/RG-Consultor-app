import { useMemo } from 'react';
import { useWindowDimensions } from 'react-native';

import { space } from '@/constants/layout';

/** Largura mínima (dp) para layout tablet — Redmi Pad 2 e similares ~11". */
export const TABLET_MIN_WIDTH = 600;

/** Conteúdo centralizado em tablets largos (evita linhas eternas). */
export const TABLET_CONTENT_MAX_WIDTH = 1080;

/** Largura mínima para 2 colunas de cartões. */
export const TABLET_WIDE_MIN_WIDTH = 900;

/** Altura mínima de toque recomendada em tablet de campo. */
export const TABLET_TOUCH_MIN = 56;

export type TabletLayout = {
  width: number;
  height: number;
  isTablet: boolean;
  /** ≥ ~900dp — duas colunas no hub comercial */
  isWide: boolean;
  /** Tablet em landscape — mais área horizontal */
  isLandscape: boolean;
  contentMaxWidth: number;
  horizontalPadding: number;
  touchMinHeight: number;
  tabBarMaxWidth: number;
  tabBarHeight: number;
  funnelStepMinHeight: number;
  mapMinHeight: number;
  /** Largura mínima dos chips de dia na agenda */
  dayChipWidth: number;
  /** Colunas de paradas na agenda (2 em tablet largo) */
  agendaStopColumns: number;
  /** Espaço entre secções (ScrollView gap). */
  contentGap: number;
  /** Colunas para grelhas de cartões */
  cardColumns: number;
};

export function useTabletLayout(): TabletLayout {
  const { width, height } = useWindowDimensions();

  return useMemo(() => {
    const isTablet = width >= TABLET_MIN_WIDTH;
    const isWide = width >= TABLET_WIDE_MIN_WIDTH;
    const isLandscape = width > height;

    return {
      width,
      height,
      isTablet,
      isWide,
      isLandscape,
      contentMaxWidth: isTablet ? Math.min(width - (isWide ? 80 : 56), TABLET_CONTENT_MAX_WIDTH) : width,
      horizontalPadding: isWide ? 40 : isTablet ? 32 : 20,
      touchMinHeight: isTablet ? TABLET_TOUCH_MIN : 48,
      tabBarMaxWidth: isWide ? 720 : isTablet ? 560 : width,
      tabBarHeight: isTablet ? 72 : 62,
      funnelStepMinHeight: isTablet ? 60 : 48,
      mapMinHeight: isWide ? 320 : isTablet ? 280 : 200,
      dayChipWidth: isTablet ? 108 : 86,
      agendaStopColumns: isWide ? 2 : 1,
      contentGap: isTablet ? space.lg : space.md,
      cardColumns: isWide ? 2 : 1,
    };
  }, [width, height]);
}
