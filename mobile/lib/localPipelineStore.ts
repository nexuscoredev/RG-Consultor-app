import AsyncStorage from '@react-native-async-storage/async-storage';

import type { PipelineRow } from '@/lib/api';

const KEY = 'rg_local_pipeline_v1';

export type LocalPipelineEntry = {
  id: string;
  account: string;
  stage: string;
  owner: string;
  value: string;
  docPending?: string;
  source: 'meeting' | 'proposal' | 'visit';
  linkedMeetingId?: string;
  proposalNumber?: string;
  updatedAt: number;
};

export type PipelineViewRow = PipelineRow & {
  id: string;
  source: 'api' | 'local';
  updatedAt?: number;
  proposalNumber?: string;
};

export async function loadLocalPipeline(): Promise<LocalPipelineEntry[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as LocalPipelineEntry[]) : [];
  } catch {
    return [];
  }
}

async function saveLocalPipeline(rows: LocalPipelineEntry[]): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(rows));
}

export async function upsertLocalPipeline(
  entry: Omit<LocalPipelineEntry, 'updatedAt'> & { updatedAt?: number },
): Promise<LocalPipelineEntry> {
  const rows = await loadLocalPipeline();
  const at = entry.updatedAt ?? Date.now();
  const row: LocalPipelineEntry = { ...entry, updatedAt: at };
  const idx = rows.findIndex((r) => r.id === row.id);
  if (idx >= 0) rows[idx] = row;
  else rows.unshift(row);
  await saveLocalPipeline(rows);
  return row;
}

export function inferStageFromMeeting(nextAction: string, notes: string): string {
  const text = `${nextAction} ${notes}`.toLowerCase();
  if (text.includes('proposta') || text.includes('pdf')) return 'Proposta — follow-up';
  if (text.includes('mtr') || text.includes('document')) return 'Diagnóstico / documentação';
  if (text.includes('coleta') || text.includes('contrato')) return 'Fechamento / coleta';
  if (nextAction.trim()) return nextAction.trim();
  return 'Registo de visita';
}

export function formatMeetingValue(nextAction: string, nextDate: string): string {
  if (nextDate.trim() && nextAction.trim()) return `${nextAction.trim()} · ${nextDate.trim()}`;
  if (nextAction.trim()) return nextAction.trim();
  return 'Aguardando próximo passo';
}

export async function syncMeetingLogToPipeline(entry: {
  id: string;
  client: string;
  notes: string;
  nextAction: string;
  nextDate: string;
}): Promise<LocalPipelineEntry> {
  return upsertLocalPipeline({
    id: `meeting-${entry.id}`,
    account: entry.client,
    stage: inferStageFromMeeting(entry.nextAction, entry.notes),
    owner: 'Você',
    value: formatMeetingValue(entry.nextAction, entry.nextDate),
    source: 'meeting',
    linkedMeetingId: entry.id,
  });
}

export async function syncProposalToPipeline(entry: {
  company: string;
  value: string;
  proposalNumber: string;
  scope?: string;
}): Promise<LocalPipelineEntry> {
  const docHint =
    entry.scope?.toLowerCase().includes('mtr') ? 'Confirmar MTR / anexos' : undefined;
  return upsertLocalPipeline({
    id: `proposal-${entry.proposalNumber}`,
    account: entry.company,
    stage: 'Proposta enviada',
    owner: 'Você',
    value: entry.value.trim() || 'Valor a confirmar',
    docPending: docHint,
    source: 'proposal',
    proposalNumber: entry.proposalNumber,
  });
}

export async function syncContractToPipeline(entry: {
  company: string;
  value: string;
  cnpj: string;
  service: string;
}): Promise<LocalPipelineEntry> {
  return upsertLocalPipeline({
    id: `contract-${entry.company.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`,
    account: entry.company,
    stage: 'Contrato fechado',
    owner: 'Você',
    value: entry.value.trim() || 'Valor contratado',
    docPending: `CNPJ ${entry.cnpj}`,
    source: 'proposal',
  });
}

export function mergePipelineRows(api: PipelineRow[], local: LocalPipelineEntry[]): PipelineViewRow[] {
  const apiRows: PipelineViewRow[] = api.map((r, i) => ({
    ...r,
    id: `api-${i}-${r.account}`,
    source: 'api' as const,
  }));

  const localRows: PipelineViewRow[] = local.map((r) => ({
    account: r.account,
    stage: r.stage,
    owner: r.owner,
    value: r.value,
    docPending: r.docPending,
    id: r.id,
    source: 'local' as const,
    updatedAt: r.updatedAt,
    proposalNumber: r.proposalNumber,
  }));

  const byAccount = new Map<string, PipelineViewRow>();
  for (const row of [...apiRows, ...localRows]) {
    const key = row.account.trim().toLowerCase();
    const prev = byAccount.get(key);
    if (!prev || (row.updatedAt ?? 0) > (prev.updatedAt ?? 0)) {
      byAccount.set(key, row);
    }
  }

  return [...byAccount.values()].sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0));
}

export function countOpenPipeline(rows: PipelineViewRow[]): number {
  return rows.filter((r) => !/contrato ativo|renovação anual/i.test(r.stage)).length;
}
