import { COMMERCIAL_PHASE_ORDER, phaseShortLabel, type CommercialPhase } from '@/lib/commercialFunnel';

type Props = {
  counts: Record<CommercialPhase, number>;
  total?: number;
};

export function PipelineChart({ counts, total }: Props) {
  const sum = total ?? COMMERCIAL_PHASE_ORDER.reduce((a, p) => a + counts[p], 0);
  const max = Math.max(1, ...COMMERCIAL_PHASE_ORDER.map((p) => counts[p]));

  return (
    <div className="pipeline-chart" aria-label="Distribuição do pipeline por fase">
      <div className="pipeline-chart__header">
        <span className="pipeline-chart__title">Pipeline por fase</span>
        <span className="pipeline-chart__total">{sum} oportunidade{sum === 1 ? '' : 's'}</span>
      </div>
      <div className="pipeline-chart__bars">
        {COMMERCIAL_PHASE_ORDER.map((phase) => {
          const n = counts[phase];
          const pct = (n / max) * 100;
          return (
            <div key={phase} className="pipeline-chart__row">
              <span className="pipeline-chart__label">{phaseShortLabel(phase)}</span>
              <div className="pipeline-chart__bar-wrap">
                <div
                  className={`pipeline-chart__bar pipeline-chart__bar--${phase}`}
                  style={{ width: `${pct}%` }}
                  role="presentation"
                />
              </div>
              <span className="pipeline-chart__value">{n}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
