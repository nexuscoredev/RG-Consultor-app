import type { CommercialPhase } from './commercialFunnel';
import { COMMERCIAL_PHASE_ORDER } from './commercialFunnel';

export function nextPhase(phase: CommercialPhase): CommercialPhase | null {
  const idx = COMMERCIAL_PHASE_ORDER.indexOf(phase);
  if (idx < 0 || idx >= COMMERCIAL_PHASE_ORDER.length - 1) return null;
  return COMMERCIAL_PHASE_ORDER[idx + 1];
}

export function prevPhase(phase: CommercialPhase): CommercialPhase | null {
  const idx = COMMERCIAL_PHASE_ORDER.indexOf(phase);
  if (idx <= 0) return null;
  return COMMERCIAL_PHASE_ORDER[idx - 1];
}
