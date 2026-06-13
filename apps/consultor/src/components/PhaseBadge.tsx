import type { CommercialPhase } from '@/lib/commercialFunnel';
import { phaseShortLabel } from '@/lib/commercialFunnel';

type Props = {
  phase: CommercialPhase;
};

export function PhaseBadge({ phase }: Props) {
  return <span className={`phase-badge phase-badge--${phase}`}>{phaseShortLabel(phase)}</span>;
}
