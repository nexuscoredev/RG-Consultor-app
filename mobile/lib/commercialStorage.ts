import AsyncStorage from '@react-native-async-storage/async-storage';

const DOCS_KEY = 'rg_commercial_docs_checklist_v2';
const MEETINGS_KEY = 'rg_commercial_meeting_logs_v1';
const VISIT_PLAYBOOK_KEY = 'rg_commercial_visit_playbook_v2';
const PROSPECTING_KEY = 'rg_commercial_prospecting_v1';
const ACCEPTANCE_KEY = 'rg_commercial_acceptance_v1';
const DRAFT_PROSPECTING_KEY = 'rg_draft_prospecting_v1';
const DRAFT_PROPOSAL_KEY = 'rg_draft_proposal_v1';
const DRAFT_ACCEPTANCE_KEY = 'rg_draft_acceptance_v1';
const DRAFT_CONTRACT_KEY = 'rg_draft_contract_v1';

/** Limite de registos históricos por tipo (evita AsyncStorage ilimitado). */
export const MAX_COMMERCIAL_HISTORY = 80;

/** Quantos itens mostrar nas listas de histórico nas telas. */
export const COMMERCIAL_HISTORY_UI_PAGE = 30;

function trimHistory<T>(rows: T[]): T[] {
  return rows.slice(0, MAX_COMMERCIAL_HISTORY);
}

export type DocsChecklistState = Record<string, boolean>;

function scopedKey(base: string, clientKey?: string): string {
  if (!clientKey?.trim()) return `${base}:global`;
  return `${base}:${clientKey.trim()}`;
}

export async function loadDocsChecklist(clientKey?: string): Promise<DocsChecklistState> {
  try {
    const raw = await AsyncStorage.getItem(scopedKey(DOCS_KEY, clientKey));
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    return typeof parsed === 'object' && parsed !== null ? (parsed as DocsChecklistState) : {};
  } catch {
    return {};
  }
}

export async function saveDocsChecklist(state: DocsChecklistState, clientKey?: string): Promise<void> {
  await AsyncStorage.setItem(scopedKey(DOCS_KEY, clientKey), JSON.stringify(state));
}

export type MeetingLogEntry = {
  id: string;
  at: number;
  client: string;
  notes: string;
  nextAction: string;
  nextDate: string;
};

export async function loadMeetingLogs(): Promise<MeetingLogEntry[]> {
  try {
    const raw = await AsyncStorage.getItem(MEETINGS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as MeetingLogEntry[]) : [];
  } catch {
    return [];
  }
}

export async function saveMeetingLogs(entries: MeetingLogEntry[]): Promise<void> {
  await saveJsonList(MEETINGS_KEY, entries);
}

export async function loadVisitPlaybookChecks(clientKey?: string): Promise<Record<string, boolean>> {
  try {
    const raw = await AsyncStorage.getItem(scopedKey(VISIT_PLAYBOOK_KEY, clientKey));
    if (!raw) return {};
    const p = JSON.parse(raw) as unknown;
    return typeof p === 'object' && p !== null ? (p as Record<string, boolean>) : {};
  } catch {
    return {};
  }
}

export async function saveVisitPlaybookChecks(s: Record<string, boolean>, clientKey?: string): Promise<void> {
  await AsyncStorage.setItem(scopedKey(VISIT_PLAYBOOK_KEY, clientKey), JSON.stringify(s));
}

export type ProspectingRecord = {
  id: string;
  at: number;
  company: string;
  tradeName: string;
  cnpj: string;
  segment: string;
  contactName: string;
  contactRole: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  source: string;
  wasteTypes: string;
  volumeMonthly: string;
  currentProvider: string;
  painPoints: string;
  budgetRange: string;
  decisionMaker: string;
  urgency: string;
  nextStep: string;
  nextDate: string;
  notes: string;
};

export type AcceptanceRecord = {
  id: string;
  at: number;
  company: string;
  proposalNumber: string;
  contactName: string;
  email: string;
  phone: string;
  acceptedValue: string;
  scopeSummary: string;
  acceptanceType: string;
  acceptanceDate: string;
  docsPending: string;
  sendChannel: string;
  notes: string;
};

async function loadJsonList<T>(key: string): Promise<T[]> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

async function saveJsonList<T>(key: string, rows: T[]): Promise<void> {
  await AsyncStorage.setItem(key, JSON.stringify(trimHistory(rows)));
}

export async function loadProspectingRecords(): Promise<ProspectingRecord[]> {
  return loadJsonList<ProspectingRecord>(PROSPECTING_KEY);
}

export async function saveProspectingRecords(rows: ProspectingRecord[]): Promise<void> {
  await saveJsonList(PROSPECTING_KEY, rows);
}

export async function loadAcceptanceRecords(): Promise<AcceptanceRecord[]> {
  return loadJsonList<AcceptanceRecord>(ACCEPTANCE_KEY);
}

export async function saveAcceptanceRecords(rows: AcceptanceRecord[]): Promise<void> {
  await saveJsonList(ACCEPTANCE_KEY, rows);
}

export type ProspectingDraft = {
  company: string;
  tradeName: string;
  cnpj: string;
  segment: string;
  address: string;
  city: string;
  contactName: string;
  contactRole: string;
  phone: string;
  email: string;
  source: string;
  wasteTypes: string;
  volumeMonthly: string;
  currentProvider: string;
  painPoints: string;
  budgetRange: string;
  decisionMaker: string;
  urgency: string;
  nextStep: string;
  nextDate: string;
  notes: string;
};

export type ProposalDraft = {
  clientName: string;
  company: string;
  email: string;
  scope: string;
  value: string;
  validity: string;
  proposalNumber: string;
};

export type AcceptanceDraft = {
  company: string;
  proposalNumber: string;
  contactName: string;
  email: string;
  phone: string;
  acceptedValue: string;
  scopeSummary: string;
  acceptanceType: string;
  acceptanceDate: string;
  docChecks: Record<string, boolean>;
  consultant: string;
  deadline: string;
  notes: string;
};

export type ContractDraft = {
  step: number;
  account: string;
  cnpj: string;
  service: string;
  volume: string;
  value: string;
  term: string;
};

async function loadDraft<T>(baseKey: string, scopeKey: string): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(scopedKey(baseKey, scopeKey));
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

async function saveDraft<T>(baseKey: string, scopeKey: string, data: T): Promise<void> {
  await AsyncStorage.setItem(scopedKey(baseKey, scopeKey), JSON.stringify(data));
}

async function clearDraftKey(baseKey: string, scopeKey: string): Promise<void> {
  await AsyncStorage.removeItem(scopedKey(baseKey, scopeKey));
}

export const prospectingDraftStorage = {
  load: (scopeKey: string) => loadDraft<ProspectingDraft>(DRAFT_PROSPECTING_KEY, scopeKey),
  save: (scopeKey: string, data: ProspectingDraft) => saveDraft(DRAFT_PROSPECTING_KEY, scopeKey, data),
  clear: (scopeKey: string) => clearDraftKey(DRAFT_PROSPECTING_KEY, scopeKey),
};

export const proposalDraftStorage = {
  load: (scopeKey: string) => loadDraft<ProposalDraft>(DRAFT_PROPOSAL_KEY, scopeKey),
  save: (scopeKey: string, data: ProposalDraft) => saveDraft(DRAFT_PROPOSAL_KEY, scopeKey, data),
  clear: (scopeKey: string) => clearDraftKey(DRAFT_PROPOSAL_KEY, scopeKey),
};

export const acceptanceDraftStorage = {
  load: (scopeKey: string) => loadDraft<AcceptanceDraft>(DRAFT_ACCEPTANCE_KEY, scopeKey),
  save: (scopeKey: string, data: AcceptanceDraft) => saveDraft(DRAFT_ACCEPTANCE_KEY, scopeKey, data),
  clear: (scopeKey: string) => clearDraftKey(DRAFT_ACCEPTANCE_KEY, scopeKey),
};

export const contractDraftStorage = {
  load: (scopeKey: string) => loadDraft<ContractDraft>(DRAFT_CONTRACT_KEY, scopeKey),
  save: (scopeKey: string, data: ContractDraft) => saveDraft(DRAFT_CONTRACT_KEY, scopeKey, data),
  clear: (scopeKey: string) => clearDraftKey(DRAFT_CONTRACT_KEY, scopeKey),
};

export function draftScopeKey(company?: string, stopId?: string): string {
  const s = stopId?.trim();
  if (s) return s;
  const c = company?.trim();
  if (c) return c.toLowerCase().replace(/\s+/g, '-');
  return 'global';
}
