import AsyncStorage from '@react-native-async-storage/async-storage';

const DOCS_KEY = 'rg_commercial_docs_checklist_v2';
const MEETINGS_KEY = 'rg_commercial_meeting_logs_v1';
const VISIT_PLAYBOOK_KEY = 'rg_commercial_visit_playbook_v2';

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
  await AsyncStorage.setItem(MEETINGS_KEY, JSON.stringify(entries));
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
