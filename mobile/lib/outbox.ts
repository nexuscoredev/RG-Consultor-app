import type { CheckInPayload } from '@rg-ambiental/shared';
import { getDb } from '@/lib/db';

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

function newId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
}

export function enqueueCheckIn(payload: CheckInPayload): string {
  const id = newId();
  const database = getDb();
  database.runSync(
    `INSERT INTO outbox (id, type, payload, created_at, status) VALUES (?, ?, ?, ?, 'pending')`,
    id,
    'CHECK_IN',
    JSON.stringify(payload),
    Date.now(),
  );
  return id;
}

export function enqueueCheckOut(payload: CheckInPayload): string {
  const id = newId();
  const database = getDb();
  database.runSync(
    `INSERT INTO outbox (id, type, payload, created_at, status) VALUES (?, ?, ?, ?, 'pending')`,
    id,
    'CHECK_OUT',
    JSON.stringify(payload),
    Date.now(),
  );
  return id;
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

/** Process pending rows (mock API). Continua após falhas; backoff exponencial até max retries. */
export function processOutboxSync(): { synced: number; error?: string } {
  const database = getDb();
  const now = Date.now();
  const rows = database.getAllSync<OutboxRow>(
    `SELECT id, type, payload, created_at, status, retries, last_error, COALESCE(next_attempt_at, 0) as next_attempt_at
     FROM outbox
     WHERE status = 'pending' AND COALESCE(next_attempt_at, 0) <= ?
     ORDER BY created_at ASC LIMIT 25`,
    now,
  );
  let synced = 0;
  let lastErr: string | undefined;
  for (const row of rows) {
    try {
      // Substituir por fetch real ao backend NestJS
      const ok = Math.random() > 0.03;
      if (!ok) {
        throw new Error('Erro simulado de rede');
      }
      database.runSync(
        `UPDATE outbox SET status = 'synced', last_error = NULL, next_attempt_at = 0 WHERE id = ?`,
        row.id,
      );
      synced += 1;
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'sync_error';
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
      lastErr = msg;
    }
  }
  return { synced, error: lastErr };
}
