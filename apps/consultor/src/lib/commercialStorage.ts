import { getJson, setJson } from './storage';

const MAX_HISTORY = 80;

function scopedKey(base: string, clientKey?: string): string {
  return clientKey?.trim() ? `${base}:${clientKey.trim()}` : `${base}:global`;
}

function trimHistory<T>(rows: T[]): T[] {
  return rows.slice(0, MAX_HISTORY);
}

export type DocsChecklistState = Record<string, boolean>;

export function loadDocsChecklist(clientKey?: string): DocsChecklistState {
  return getJson<DocsChecklistState>(scopedKey('rg_docs_checklist', clientKey), {});
}

export function saveDocsChecklist(state: DocsChecklistState, clientKey?: string): void {
  setJson(scopedKey('rg_docs_checklist', clientKey), state);
}

export type MeetingLogEntry = {
  id: string;
  at: number;
  client: string;
  notes: string;
  nextAction: string;
  nextDate: string;
};

const MEETINGS_KEY = 'rg_meeting_logs_v1';

export function loadMeetingLogs(): MeetingLogEntry[] {
  return getJson<MeetingLogEntry[]>(MEETINGS_KEY, []);
}

export function saveMeetingLogs(entries: MeetingLogEntry[]): void {
  setJson(MEETINGS_KEY, trimHistory(entries));
}

export function loadVisitPlaybookChecks(clientKey?: string): Record<string, boolean> {
  return getJson<Record<string, boolean>>(scopedKey('rg_visit_playbook', clientKey), {});
}

export function saveVisitPlaybookChecks(state: Record<string, boolean>, clientKey?: string): void {
  setJson(scopedKey('rg_visit_playbook', clientKey), state);
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

const PROSPECTING_KEY = 'rg_prospecting_records_v1';

export function loadProspectingRecords(): ProspectingRecord[] {
  return getJson<ProspectingRecord[]>(PROSPECTING_KEY, []);
}

export function saveProspectingRecords(rows: ProspectingRecord[]): void {
  setJson(PROSPECTING_KEY, trimHistory(rows));
}

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

const ACCEPTANCE_KEY = 'rg_acceptance_records_v1';

export function loadAcceptanceRecords(): AcceptanceRecord[] {
  return getJson<AcceptanceRecord[]>(ACCEPTANCE_KEY, []);
}

export function saveAcceptanceRecords(rows: AcceptanceRecord[]): void {
  setJson(ACCEPTANCE_KEY, trimHistory(rows));
}

export type ProspectingDraft = Omit<ProspectingRecord, 'id' | 'at'>;

export function draftScopeKey(company?: string, stopId?: string): string {
  if (stopId?.trim()) return stopId.trim();
  if (company?.trim()) return company.trim().toLowerCase().replace(/\s+/g, '-');
  return 'global';
}

export function loadProspectingDraft(scopeKey: string): ProspectingDraft | null {
  return getJson<ProspectingDraft | null>(scopedKey('rg_draft_prospecting', scopeKey), null);
}

export function saveProspectingDraft(scopeKey: string, data: ProspectingDraft): void {
  setJson(scopedKey('rg_draft_prospecting', scopeKey), data);
}

export function clearProspectingDraft(scopeKey: string): void {
  setJson(scopedKey('rg_draft_prospecting', scopeKey), null);
}

export type VisitVisitState = {
  stopId: string;
  company: string;
  checkedInAt?: number;
  checkedOutAt?: number;
};

const VISIT_STATE_KEY = 'rg_visit_states_v1';

export function loadVisitStates(): Record<string, VisitVisitState> {
  return getJson<Record<string, VisitVisitState>>(VISIT_STATE_KEY, {});
}

export function saveVisitState(stopId: string, state: VisitVisitState): void {
  const all = loadVisitStates();
  all[stopId] = state;
  setJson(VISIT_STATE_KEY, all);
}
