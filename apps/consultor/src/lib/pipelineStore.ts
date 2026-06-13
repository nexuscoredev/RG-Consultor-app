import { getJson, setJson } from './storage';
import { inferPhaseFromStage, type CommercialPhase } from './commercialFunnel';

const KEY = 'rg_local_pipeline_v1';

export type LocalPipelineEntry = {
  id: string;
  account: string;
  stage: string;
  phase: CommercialPhase;
  owner: string;
  value: string;
  docPending?: string;
  updatedAt: number;
};

export function loadLocalPipeline(): LocalPipelineEntry[] {
  const rows = getJson<LocalPipelineEntry[]>(KEY, []);
  return rows.map((row) => ({
    ...row,
    phase: row.phase ?? inferPhaseFromStage(row.stage),
  }));
}

export function saveLocalPipeline(rows: LocalPipelineEntry[]): void {
  setJson(KEY, rows);
}

export function upsertLocalPipeline(
  entry: Omit<LocalPipelineEntry, 'updatedAt'> & { updatedAt?: number },
): LocalPipelineEntry {
  const rows = loadLocalPipeline();
  const row: LocalPipelineEntry = {
    ...entry,
    phase: entry.phase ?? inferPhaseFromStage(entry.stage),
    updatedAt: entry.updatedAt ?? Date.now(),
  };
  const idx = rows.findIndex((r) => r.id === row.id);
  if (idx >= 0) rows[idx] = row;
  else rows.unshift(row);
  saveLocalPipeline(rows);
  return row;
}

export function inferHubPhase(rows: LocalPipelineEntry[]): CommercialPhase {
  const open = rows.find((r) => !/contrato ativo|renovação anual/i.test(r.stage));
  if (!open) return 'prospecting';
  return inferPhaseFromStage(open.stage);
}
