import type { CheckInPayload } from '@rg-ambiental/shared';
import { getDb } from '@/lib/db';
import { apiFetch } from '@/lib/apiClient';
import { isApiEnabled } from '@/lib/apiConfig';

export type OutboxRow = {
  id: string;
  type: string;
  payload: string;
  created_at: number;
  status: string;
  retries: number;
  last_error: string | null;
  /** Epoch ms — não enviar antes deste instante (backoff). */
  next_attempt_at?: number;
};

let tokenProvider: (() => string | null) | null = null;

export function setOutboxTokenProvider(fn: () => string | null): void {
  tokenProvider = fn;
}

function newId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
}

function insertOutbox(type: string, payload: unknown): string {
  const id = newId();
  const database = getDb();
  database.runSync(
    `INSERT INTO outbox (id, type, payload, created_at, status) VALUES (?, ?, ?, ?, 'pending')`,
    id,
    type,
    JSON.stringify(payload),
    Date.now(),
  );
  return id;
}

export function enqueueCheckIn(payload: CheckInPayload): string {
  return insertOutbox('CHECK_IN', payload);
}

export function enqueueCheckOut(payload: CheckInPayload): string {
  return insertOutbox('CHECK_OUT', payload);
}

export function enqueueMeetingLog(payload: {
  client: string;
  notes: string;
  nextAction: string;
  nextDate: string;
}): string {
  return insertOutbox('MEETING_LOG', payload);
}

export function enqueueProposalSent(payload: {
  company: string;
  clientName: string;
  value: string;
  proposalNumber: string;
  scope?: string;
}): string {
  return insertOutbox('PROPOSAL_SENT', payload);
}

export function enqueueContractClosed(payload: {
  company: string;
  cnpj: string;
  service: string;
  value: string;
  term: string;
}): string {
  return insertOutbox('CONTRACT_CLOSED', payload);
}

export function enqueueProspectingSaved(payload: {
  company: string;
  segment: string;
  source: string;
  contactName: string;
}): string {
  return insertOutbox('PROSPECTING_SAVED', payload);
}

export function enqueueProposalAccepted(payload: {
  company: string;
  proposalNumber: string;
  acceptedValue: string;
  acceptanceType: string;
}): string {
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
}): string {
  return insertOutbox('CLIENT_SAVED', payload);
}

export function enqueueFollowUpSent(payload: {
  company: string;
  contactName?: string;
  channel: 'email' | 'whatsapp' | 'copy';
  phase?: string;
}): string {
  return insertOutbox('FOLLOW_UP_SENT', payload);
}

export function purgeSyncedOutbox(olderThanMs = 7 * 24 * 3600_000): number {
  const database = getDb();
  const cutoff = Date.now() - olderThanMs;
  const before = database.getFirstSync<{ c: number }>(`SELECT COUNT(*) as c FROM outbox WHERE status = 'synced'`);
  database.runSync(`DELETE FROM outbox WHERE status = 'synced' AND created_at < ?`, cutoff);
  const after = database.getFirstSync<{ c: number }>(`SELECT COUNT(*) as c FROM outbox WHERE status = 'synced'`);
  return (before?.c ?? 0) - (after?.c ?? 0);
}

export function countPendingOutbox(): number {
  const database = getDb();
  const row = database.getFirstSync<{ c: number }>(
    `SELECT COUNT(*) as c FROM outbox WHERE status = 'pending'`,
  );
  return row?.c ?? 0;
}

export function countFailedOutbox(): number {
  const database = getDb();
  const row = database.getFirstSync<{ c: number }>(
    `SELECT COUNT(*) as c FROM outbox WHERE status = 'failed'`,
  );
  return row?.c ?? 0;
}

export function listOutboxForUi(limit = 30): OutboxRow[] {
  const database = getDb();
  return database.getAllSync<OutboxRow>(
    `SELECT id, type, payload, created_at, status, retries, last_error, COALESCE(next_attempt_at, 0) as next_attempt_at FROM outbox ORDER BY created_at DESC LIMIT ?`,
    limit,
  );
}

export function resetFailedToPending(): void {
  const database = getDb();
  database.runSync(
    `UPDATE outbox SET status = 'pending', last_error = NULL, next_attempt_at = 0 WHERE status = 'failed'`,
  );
}

const MAX_SYNC_RETRIES = 8;

function backoffMs(retries: number): number {
  const base = 15_000;
  const cap = 600_000;
  return Math.min(cap, base * Math.pow(2, Math.max(0, retries)));
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

function markSynced(database: ReturnType<typeof getDb>, id: string): void {
  database.runSync(
    `UPDATE outbox SET status = 'synced', last_error = NULL, next_attempt_at = 0 WHERE id = ?`,
    id,
  );
}

function markFailed(database: ReturnType<typeof getDb>, row: OutboxRow, msg: string): void {
  const nextRetries = row.retries + 1;
  const nextAt = Date.now() + backoffMs(row.retries);
  if (nextRetries >= MAX_SYNC_RETRIES) {
    database.runSync(
      `UPDATE outbox SET status = 'failed', retries = ?, last_error = ?, next_attempt_at = 0 WHERE id = ?`,
      nextRetries,
      msg,
      row.id,
    );
  } else {
    database.runSync(
      `UPDATE outbox SET retries = ?, last_error = ?, next_attempt_at = ? WHERE id = ?`,
      nextRetries,
      msg,
      nextAt,
      row.id,
    );
  }
}

/** Process pending rows — API real ou simulação local. */
export async function processOutboxSync(): Promise<{ synced: number; error?: string }> {
  const database = getDb();
  const now = Date.now();
  const rows = database.getAllSync<OutboxRow>(
    `SELECT id, type, payload, created_at, status, retries, last_error, COALESCE(next_attempt_at, 0) as next_attempt_at
     FROM outbox
     WHERE status = 'pending' AND COALESCE(next_attempt_at, 0) <= ?
     ORDER BY created_at ASC LIMIT 25`,
    now,
  );

  const authToken = tokenProvider?.() ?? null;
  const useApi = isApiEnabled() && authToken;

  let synced = 0;
  let lastErr: string | undefined;
  const BATCH = 8;

  for (let i = 0; i < rows.length; i += BATCH) {
    const chunk = rows.slice(i, i + BATCH);
    try {
      if (!useApi) {
        lastErr = 'api_offline';
        continue;
      }
      await syncBatchToApi(chunk, authToken);
      for (const row of chunk) {
        markSynced(database, row.id);
        synced += 1;
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'sync_error';
      for (const row of chunk) {
        markFailed(database, row, msg);
      }
      lastErr = msg;
    }
  }

  if (synced > 0) purgeSyncedOutbox();

  return { synced, error: lastErr };
}
