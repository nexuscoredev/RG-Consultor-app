import type { PipelineRow } from '@/lib/api';
import type { CommercialPhase } from '@/lib/commercialFunnel';

export function countByPhase(rows: { phase: CommercialPhase }[]): Record<CommercialPhase, number> {
  return {
    prospecting: rows.filter((r) => r.phase === 'prospecting').length,
    proposal: rows.filter((r) => r.phase === 'proposal').length,
    acceptance: rows.filter((r) => r.phase === 'acceptance').length,
    contract: rows.filter((r) => r.phase === 'contract').length,
  };
}

export function openPipelineRows(rows: PipelineRow[]): PipelineRow[] {
  return rows.filter((r) => !/contrato ativo|renovação anual/i.test(r.stage));
}
