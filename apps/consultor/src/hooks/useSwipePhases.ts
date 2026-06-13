import { useCallback, useRef } from 'react';

import type { CommercialPhase } from '@/lib/commercialFunnel';
import { nextPhase, prevPhase } from '@/lib/phaseNav';

const SWIPE_THRESHOLD = 56;
const MAX_VERTICAL = 80;

type Options = {
  phase: CommercialPhase;
  onPhase: (phase: CommercialPhase) => void;
};

export function useSwipePhases({ phase, onPhase }: Options) {
  const start = useRef<{ x: number; y: number } | null>(null);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    const t = e.touches[0];
    start.current = { x: t.clientX, y: t.clientY };
  }, []);

  const onTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (!start.current) return;
      const t = e.changedTouches[0];
      const dx = t.clientX - start.current.x;
      const dy = t.clientY - start.current.y;
      start.current = null;

      if (Math.abs(dy) > MAX_VERTICAL) return;
      if (Math.abs(dx) < SWIPE_THRESHOLD) return;

      if (dx < 0) {
        const n = nextPhase(phase);
        if (n) onPhase(n);
      } else {
        const p = prevPhase(phase);
        if (p) onPhase(p);
      }
    },
    [phase, onPhase],
  );

  return { onTouchStart, onTouchEnd };
}
