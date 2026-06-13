import { useCallback, useRef, useState } from 'react';

type Options = {
  onRefresh: () => Promise<void>;
  threshold?: number;
};

export function usePullRefresh({ onRefresh, threshold = 72 }: Options) {
  const [pullDistance, setPullDistance] = useState(0);
  const [pulling, setPulling] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef(0);
  const pull = useRef(0);
  const refreshingRef = useRef(false);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    if (window.scrollY > 8) return;
    startY.current = e.touches[0].clientY;
    pull.current = 0;
    setPullDistance(0);
    setPulling(false);
  }, []);

  const onTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (startY.current === 0) return;
      const dy = e.touches[0].clientY - startY.current;
      if (dy > 0) {
        const dist = Math.min(dy, threshold * 1.4);
        pull.current = dist;
        setPullDistance(dist);
        setPulling(dist >= threshold);
      }
    },
    [threshold],
  );

  const onTouchEnd = useCallback(async () => {
    if (pull.current >= threshold && !refreshingRef.current) {
      refreshingRef.current = true;
      setRefreshing(true);
      try {
        await onRefresh();
      } finally {
        refreshingRef.current = false;
        setRefreshing(false);
      }
    }
    startY.current = 0;
    pull.current = 0;
    setPullDistance(0);
    setPulling(false);
  }, [onRefresh, threshold]);

  return {
    pullDistance,
    pulling,
    refreshing,
    handlers: { onTouchStart, onTouchMove, onTouchEnd },
  };
}
