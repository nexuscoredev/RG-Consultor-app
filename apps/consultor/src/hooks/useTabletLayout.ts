import { useEffect, useState } from 'react';

/** Redmi Pad 2 e tablets ~11" — alinhado ao mobile Expo. */
export const TABLET_MIN_WIDTH = 600;
export const TABLET_WIDE_MIN_WIDTH = 900;
export const TABLET_CONTENT_MAX = 1080;
export const TABLET_TOUCH_MIN = 52;

export type TabletLayout = {
  width: number;
  height: number;
  isTablet: boolean;
  isWide: boolean;
  isLandscape: boolean;
  contentMaxWidth: number;
  horizontalPadding: number;
  touchMinHeight: number;
  gridColumns: number;
};

function readLayout(): TabletLayout {
  const width = window.innerWidth;
  const height = window.innerHeight;
  const isTablet = width >= TABLET_MIN_WIDTH;
  const isWide = width >= TABLET_WIDE_MIN_WIDTH;
  const isLandscape = width > height;

  return {
    width,
    height,
    isTablet,
    isWide,
    isLandscape,
    contentMaxWidth: isTablet ? Math.min(width - (isWide ? 80 : 48), TABLET_CONTENT_MAX) : width,
    horizontalPadding: isWide ? 40 : isTablet ? 28 : 16,
    touchMinHeight: isTablet ? TABLET_TOUCH_MIN : 44,
    gridColumns: isWide ? 2 : 1,
  };
}

export function useTabletLayout(): TabletLayout {
  const [layout, setLayout] = useState<TabletLayout>(() =>
    typeof window !== 'undefined' ? readLayout() : {
      width: 0,
      height: 0,
      isTablet: false,
      isWide: false,
      isLandscape: false,
      contentMaxWidth: 0,
      horizontalPadding: 16,
      touchMinHeight: 44,
      gridColumns: 1,
    },
  );

  useEffect(() => {
    const onResize = () => setLayout(readLayout());
    window.addEventListener('resize', onResize);
    onResize();
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return layout;
}
