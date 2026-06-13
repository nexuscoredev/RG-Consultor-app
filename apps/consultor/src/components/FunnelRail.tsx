import { COMMERCIAL_PHASE_ORDER, phaseShortLabel, type CommercialPhase } from '@/lib/commercialFunnel';

type Props = {
  activePhase: CommercialPhase;
  onSelect?: (phase: CommercialPhase) => void;
  counts?: Partial<Record<CommercialPhase, number>>;
};

const PHASE_NUM: Record<CommercialPhase, number> = {
  prospecting: 1,
  proposal: 2,
  acceptance: 3,
  contract: 4,
};

export function FunnelRail({ activePhase, onSelect, counts }: Props) {
  const activeIdx = COMMERCIAL_PHASE_ORDER.indexOf(activePhase);

  return (
    <div className="funnel-rail" role="tablist" aria-label="Progresso do funil comercial">
      <div className="funnel-rail__track" aria-hidden>
        <div
          className="funnel-rail__progress"
          style={{ width: `${((activeIdx + 1) / COMMERCIAL_PHASE_ORDER.length) * 100}%` }}
        />
      </div>
      <div className="funnel-rail__steps">
        {COMMERCIAL_PHASE_ORDER.map((phase, idx) => {
          const state = idx < activeIdx ? 'done' : idx === activeIdx ? 'active' : 'todo';
          const count = counts?.[phase];
          return (
            <button
              key={phase}
              type="button"
              role="tab"
              aria-selected={phase === activePhase}
              className={`funnel-rail__step funnel-rail__step--${state}`}
              onClick={() => onSelect?.(phase)}>
              <span className="funnel-rail__orb">{PHASE_NUM[phase]}</span>
              <span className="funnel-rail__label">{phaseShortLabel(phase)}</span>
              {count != null && count > 0 ? (
                <span className="funnel-rail__count">{count}</span>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
