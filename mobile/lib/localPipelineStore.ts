import AsyncStorage from '@react-native-async-storage/async-storage';

import type { PipelineRow } from '@/lib/api';
import { FUNNEL_STAGE, inferPhaseFromStage, type CommercialPhase } from '@/lib/commercialFunnel';

const KEY = 'rg_local_pipeline_v1';

export type LocalPipelineEntry = {
  id: string;
  account: string;
  stage: string;
  phase: CommercialPhase;
  owner: string;
  value: string;
  docPending?: string;
  source: 'meeting' | 'proposal' | 'visit' | 'prospecting' | 'acceptance';
  linkedMeetingId?: string;
  proposalNumber?: string;
  updatedAt: number;
  /** Contexto da parada — preserva ligação com agenda/visita. */
  routeDate?: string;
  stopId?: string;
  contact?: string;
  address?: string;
  city?: string;
  phone?: string;
};

export type PipelineViewRow = PipelineRow & {
  id: string;
  source: 'api' | 'local';
  updatedAt?: number;
  proposalNumber?: string;
  routeDate?: string;
  stopId?: string;
  contact?: string;
  address?: string;
  city?: string;
  phone?: string;
};

export async function loadLocalPipeline(): Promise<LocalPipelineEntry[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed)
      ? (parsed as LocalPipelineEntry[]).map((row) => ({
          ...row,
          phase: row.phase ?? inferPhaseFromStage(row.stage),
        }))
      : [];
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
  const row: LocalPipelineEntry = {
    ...entry,
    phase: entry.phase ?? inferPhaseFromStage(entry.stage),
    updatedAt: at,
  };
  const idx = rows.findIndex((r) => r.id === row.id);
  if (idx >= 0) rows[idx] = row;
  else rows.unshift(row);
  await saveLocalPipeline(rows);
  return row;
}

export function inferStageFromMeeting(nextAction: string, notes: string): string {
  const text = `${nextAction} ${notes}`.toLowerCase();
  if (text.includes('contrato') || text.includes('fechamento')) return FUNNEL_STAGE.contractClosed;
  if (text.includes('aceite') || text.includes('aceita')) return FUNNEL_STAGE.accepted;
  if (text.includes('proposta') || text.includes('pdf')) return FUNNEL_STAGE.proposalFollowup;
  if (text.includes('mtr') || text.includes('document')) return FUNNEL_STAGE.prospectingDocs;
  if (nextAction.trim()) return nextAction.trim();
  return FUNNEL_STAGE.visitLogged;
}

export function formatMeetingValue(nextAction: string, nextDate: string): string {
  if (nextDate.trim() && nextAction.trim()) return `${nextAction.trim()} · ${nextDate.trim()}`;
  if (nextAction.trim()) return nextAction.trim();
  return 'Aguardando próximo passo';
}

type VisitMetaFields = Pick<
  LocalPipelineEntry,
  'routeDate' | 'stopId' | 'contact' | 'address' | 'city' | 'phone'
>;

export async function syncMeetingLogToPipeline(entry: {
  id: string;
  client: string;
  notes: string;
  nextAction: string;
  nextDate: string;
  visit?: VisitMetaFields;
}): Promise<LocalPipelineEntry> {
  return upsertLocalPipeline({
    id: `meeting-${entry.id}`,
    account: entry.client,
    stage: inferStageFromMeeting(entry.nextAction, entry.notes),
    phase: inferPhaseFromStage(inferStageFromMeeting(entry.nextAction, entry.notes)),
    owner: 'Você',
    value: formatMeetingValue(entry.nextAction, entry.nextDate),
    source: 'meeting',
    linkedMeetingId: entry.id,
    ...entry.visit,
  });
}

export async function syncFollowupToPipeline(entry: {
  company: string;
  nextStep: string;
  deadline: string;
  visit?: VisitMetaFields;
}): Promise<LocalPipelineEntry> {
  const id = `followup-${entry.company.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`;
  return upsertLocalPipeline({
    id,
    account: entry.company,
    stage: FUNNEL_STAGE.proposalFollowup,
    phase: 'proposal',
    owner: 'Você',
    value: formatMeetingValue(entry.nextStep, entry.deadline),
    source: 'meeting',
    ...entry.visit,
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
    stage: FUNNEL_STAGE.proposalSent,
    phase: 'proposal',
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
    stage: FUNNEL_STAGE.contractClosed,
    phase: 'contract',
    owner: 'Você',
    value: entry.value.trim() || 'Valor contratado',
    docPending: `CNPJ ${entry.cnpj}`,
    source: 'proposal',
  });
}

export function mergePipelineRows(api: PipelineRow[], local: LocalPipelineEntry[]): PipelineViewRow[] {
  const apiRows: PipelineViewRow[] = api.map((r) => ({
    account: r.account,
    stage: r.stage,
    phase: r.phase,
    owner: r.owner,
    value: r.value,
    docPending: r.docPending,
    id: r.id,
    source: 'api' as const,
    updatedAt: r.updatedAt,
  }));

  const localRows: PipelineViewRow[] = local.map((r) => ({
    account: r.account,
    stage: r.stage,
    phase: r.phase,
    owner: r.owner,
    value: r.value,
    docPending: r.docPending,
    id: r.id,
    source: 'local' as const,
    updatedAt: r.updatedAt,
    proposalNumber: r.proposalNumber,
    routeDate: r.routeDate,
    stopId: r.stopId,
    contact: r.contact,
    address: r.address,
    city: r.city,
    phone: r.phone,
  }));

  const byKey = new Map<string, PipelineViewRow>();
  for (const row of [...apiRows, ...localRows]) {
    const accountKey = row.account.trim().toLowerCase();
    const prev = byKey.get(accountKey);
    if (!prev || (row.updatedAt ?? 0) > (prev.updatedAt ?? 0)) {
      byKey.set(accountKey, row);
    }
  }

  return [...byKey.values()].sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0));
}

export function countOpenPipeline(rows: PipelineViewRow[]): number {
  return rows.filter((r) => !/contrato ativo|renovação anual/i.test(r.stage)).length;
}

export async function syncProspectingToPipeline(entry: {
  id: string;
  company: string;
  nextStep: string;
  nextDate: string;
  segment: string;
  volumeMonthly: string;
}): Promise<LocalPipelineEntry> {
  const valueParts = [entry.segment.trim(), entry.volumeMonthly.trim() ? `${entry.volumeMonthly.trim()} t/mês` : '']
    .filter(Boolean)
    .join(' · ');
  return upsertLocalPipeline({
    id: `prospect-${entry.id}`,
    account: entry.company,
    stage: FUNNEL_STAGE.prospecting,
    phase: 'prospecting',
    owner: 'Você',
    value: formatMeetingValue(entry.nextStep, entry.nextDate) || valueParts || 'Qualificação em curso',
    docPending: valueParts || undefined,
    source: 'prospecting',
  });
}

export async function syncAcceptanceToPipeline(entry: {
  id: string;
  company: string;
  proposalNumber: string;
  acceptedValue: string;
  docsPending?: string;
}): Promise<LocalPipelineEntry> {
  return upsertLocalPipeline({
    id: `accept-${entry.id}`,
    account: entry.company,
    stage: FUNNEL_STAGE.accepted,
    phase: 'acceptance',
    owner: 'Você',
    value: entry.acceptedValue.trim() || 'Valor aceite',
    docPending: entry.docsPending,
    source: 'acceptance',
    proposalNumber: entry.proposalNumber,
  });
}
