import { COMMERCIAL_PHASE_ORDER, phaseLabel, type CommercialPhase } from '@/lib/commercialFunnel';

type Props = {
  activePhase: CommercialPhase;
  onSelect?: (phase: CommercialPhase) => void;
};

export function FunnelStepper({ activePhase, onSelect }: Props) {
  return (
    <div className="funnel-stepper" role="tablist" aria-label="Fases do funil comercial">
      {COMMERCIAL_PHASE_ORDER.map((phase) => {
        const active = phase === activePhase;
        return (
          <button
            key={phase}
            type="button"
            role="tab"
            aria-selected={active}
            className={`funnel-stepper__item${active ? ' funnel-stepper__item--active' : ''}`}
            onClick={() => onSelect?.(phase)}>
            {phaseLabel(phase)}
          </button>
        );
      })}
    </div>
  );
}
