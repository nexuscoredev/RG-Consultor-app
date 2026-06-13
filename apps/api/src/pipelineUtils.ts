import type { PipelineRow } from './seed.js';

export type CommercialPhase = 'prospecting' | 'proposal' | 'acceptance' | 'contract';

export function inferPhaseFromStage(stage: string): CommercialPhase {
  const s = stage.toLowerCase();
  if (/contrato/i.test(s)) return 'contract';
  if (/aceite|aceita|intenção|intencao/i.test(s)) return 'acceptance';
  if (/proposta/i.test(s)) return 'proposal';
  return 'prospecting';
}

export function normalizePipelineRow(
  row: Partial<PipelineRow> & Pick<PipelineRow, 'account' | 'stage'>,
): PipelineRow {
  const now = Date.now();
  const slug = row.account.toLowerCase().replace(/\s+/g, '-');
  return {
    id: row.id ?? `pipeline-${slug}`,
    account: row.account,
    stage: row.stage,
    phase: row.phase ?? inferPhaseFromStage(row.stage),
    owner: row.owner ?? 'Consultor Demo',
    value: row.value ?? '',
    docPending: row.docPending,
    updatedAt: row.updatedAt ?? now,
  };
}

export function upsertPipelineRow(
  map: Map<string, PipelineRow>,
  patch: Partial<PipelineRow> & Pick<PipelineRow, 'account' | 'stage'>,
): PipelineRow {
  const key = patch.account.toLowerCase();
  const prev = map.get(key);
  const merged = normalizePipelineRow({
    ...prev,
    ...patch,
    id: prev?.id ?? patch.id,
    updatedAt: Date.now(),
  });
  map.set(key, merged);
  return merged;
}
