import { apiFetch } from './apiClient';
import { isApiEnabled } from './apiConfig';
import { getJson, setJson } from './storage';

const OUTBOX_KEY = 'rg_outbox_v1';

export type OutboxRow = {
  id: string;
  type: string;
  payload: string;
  created_at: number;
  status: 'pending' | 'synced' | 'failed';
  retries: number;
  last_error: string | null;
  next_attempt_at: number;
};

let tokenProvider: (() => string | null) | null = null;

export function setOutboxTokenProvider(fn: () => string | null): void {
  tokenProvider = fn;
}

function newId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
}

function loadOutbox(): OutboxRow[] {
  return getJson<OutboxRow[]>(OUTBOX_KEY, []);
}

function saveOutbox(rows: OutboxRow[]): void {
  setJson(OUTBOX_KEY, rows);
}

function insertOutbox(type: string, payload: unknown): string {
  const id = newId();
  const row: OutboxRow = {
    id,
    type,
    payload: JSON.stringify(payload),
    created_at: Date.now(),
    status: 'pending',
    retries: 0,
    last_error: null,
    next_attempt_at: 0,
  };
  const rows = loadOutbox();
  rows.unshift(row);
  saveOutbox(rows.slice(0, 500));
  return id;
}

export function enqueueCheckIn(payload: { stopId: string; accountName: string; at?: number }) {
  return insertOutbox('CHECK_IN', payload);
}

export function enqueueCheckOut(payload: { stopId: string; accountName: string; at?: number }) {
  return insertOutbox('CHECK_OUT', payload);
}

export function enqueueMeetingLog(payload: {
  client: string;
  notes: string;
  nextAction: string;
  nextDate: string;
}) {
  return insertOutbox('MEETING_LOG', payload);
}

export function enqueueProposalSent(payload: {
  company: string;
  clientName: string;
  value: string;
  proposalNumber: string;
  scope?: string;
}) {
  return insertOutbox('PROPOSAL_SENT', payload);
}

export function enqueueContractClosed(payload: {
  company: string;
  cnpj: string;
  service: string;
  value: string;
  term: string;
}) {
  return insertOutbox('CONTRACT_CLOSED', payload);
}

export function enqueueProspectingSaved(payload: {
  company: string;
  segment: string;
  source: string;
  contactName: string;
}) {
  return insertOutbox('PROSPECTING_SAVED', payload);
}

export function enqueueProposalAccepted(payload: {
  company: string;
  proposalNumber: string;
  acceptedValue: string;
  acceptanceType: string;
}) {
  return insertOutbox('PROPOSAL_ACCEPTED', payload);
}

export function enqueueClientSaved(payload: {
  id: string;
  company: string;
  contactName: string;
  segment?: string;
  city?: string;
  phone?: string;
  email?: string;
  cnpj?: string;
}) {
  return insertOutbox('CLIENT_SAVED', payload);
}

export function enqueueFollowUpSent(payload: {
  company: string;
  contactName?: string;
  channel: 'email' | 'whatsapp' | 'copy';
  phase?: string;
}) {
  return insertOutbox('FOLLOW_UP_SENT', payload);
}

export function countPendingOutbox(): number {
  return loadOutbox().filter((r) => r.status === 'pending').length;
}

export function countFailedOutbox(): number {
  return loadOutbox().filter((r) => r.status === 'failed').length;
}

export function listOutboxForUi(limit = 30): OutboxRow[] {
  return loadOutbox().slice(0, limit);
}

export function resetFailedToPending(): void {
  const rows = loadOutbox().map((r) =>
    r.status === 'failed'
      ? { ...r, status: 'pending' as const, last_error: null, next_attempt_at: 0, retries: 0 }
      : r,
  );
  saveOutbox(rows);
}

export function purgeSyncedOutbox(olderThanMs = 7 * 24 * 3600_000): void {
  const cutoff = Date.now() - olderThanMs;
  saveOutbox(loadOutbox().filter((r) => r.status !== 'synced' || r.created_at >= cutoff));
}

const MAX_SYNC_RETRIES = 8;

function backoffMs(retries: number): number {
  return Math.min(600_000, 15_000 * Math.pow(2, Math.max(0, retries)));
}

type SyncEventsResponse = {
  accepted: string[];
  rejected: { id: string; reason: string }[];
};

async function syncBatchToApi(rows: OutboxRow[], authToken: string): Promise<void> {
  const events = rows.map((row) => ({
    id: row.id,
    type: row.type,
    payload: JSON.parse(row.payload) as unknown,
    createdAt: row.created_at,
  }));
  const result = await apiFetch<SyncEventsResponse>('/sync/events', {
    method: 'POST',
    token: authToken,
    body: { events },
  });
  for (const row of rows) {
    const rejection = result.rejected?.find((r) => r.id === row.id);
    if (rejection) throw new Error(rejection.reason || 'sync_rejected');
    if (!result.accepted?.includes(row.id)) throw new Error('sync_not_accepted');
  }
}

function updateRow(id: string, patch: Partial<OutboxRow>): void {
  const rows = loadOutbox();
  const idx = rows.findIndex((r) => r.id === id);
  if (idx >= 0) {
    rows[idx] = { ...rows[idx], ...patch };
    saveOutbox(rows);
  }
}

export async function processOutboxSync(): Promise<{ synced: number; error?: string }> {
  const now = Date.now();
  const pending = loadOutbox()
    .filter((r) => r.status === 'pending' && r.next_attempt_at <= now)
    .sort((a, b) => a.created_at - b.created_at);

  const authToken = tokenProvider?.() ?? null;
  const useApi = isApiEnabled() && authToken;

  let synced = 0;
  let lastErr: string | undefined;
  const BATCH = 8;

  for (let i = 0; i < pending.length; i += BATCH) {
    const chunk = pending.slice(i, i + BATCH);
    try {
      if (!useApi) {
        lastErr = 'api_offline';
        continue;
      }
      await syncBatchToApi(chunk, authToken);
      for (const row of chunk) {
        updateRow(row.id, { status: 'synced', last_error: null, next_attempt_at: 0 });
        synced += 1;
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'sync_error';
      for (const row of chunk) {
        const nextRetries = row.retries + 1;
        if (nextRetries >= MAX_SYNC_RETRIES) {
          updateRow(row.id, { status: 'failed', retries: nextRetries, last_error: msg, next_attempt_at: 0 });
        } else {
          updateRow(row.id, {
            retries: nextRetries,
            last_error: msg,
            next_attempt_at: Date.now() + backoffMs(row.retries),
          });
        }
      }
      lastErr = msg;
    }
  }

  if (synced > 0) purgeSyncedOutbox();
  return { synced, error: lastErr };
}
