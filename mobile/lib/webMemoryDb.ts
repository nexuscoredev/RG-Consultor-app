import type * as SQLite from 'expo-sqlite';
import type { SQLiteRunResult, SQLiteVariadicBindParams } from 'expo-sqlite';

/**
 * SQLite em memória para web (sem expo-sqlite / worker / WASM).
 * @see lib/db.ts — usado quando Platform.OS === 'web'.
 */
type OutboxRow = {
  id: string;
  type: string;
  payload: string;
  created_at: number;
  status: string;
  retries: number;
  last_error: string | null;
  next_attempt_at: number;
};

type VisitRow = {
  parada_id: string;
  route_date: string;
  check_in_at: string | null;
  check_out_at: string | null;
  next_step: string | null;
  next_note: string | null;
};

type MissionRow = {
  mission_id: string;
  current: number;
  target: number;
  completed: number;
  updated_at: number;
};

type RedemptionRow = {
  id: string;
  reward_id: string;
  title: string;
  coins_spent: number;
  created_at: number;
};

function norm(sql: string): string {
  return sql.replace(/\s+/g, ' ').trim();
}

function bindArgs(params: SQLiteVariadicBindParams): unknown[] {
  const a = params as unknown[];
  if (a.length === 1 && Array.isArray(a[0])) return a[0] as unknown[];
  return a;
}

function visitKey(paradaId: string, routeDate: string): string {
  return `${paradaId}\u0000${routeDate}`;
}

class WebMemoryDatabase {
  private outbox: OutboxRow[] = [];
  private routes = new Map<string, { json: string; updated_at: number }>();
  private visits = new Map<string, VisitRow>();
  private wallet = { id: 1, xp: 120, coins: 40 };
  private missions = new Map<string, MissionRow>();
  private redemptions: RedemptionRow[] = [];

  execSync(_source: string): void {
    /* schema já existe em memória; migrações ALTER são no-op */
  }

  runSync(source: string, ...params: SQLiteVariadicBindParams): SQLiteRunResult {
    const p = bindArgs(params);
    const s = norm(source);

    if (
      s ===
      `INSERT INTO outbox (id, type, payload, created_at, status) VALUES (?, ?, ?, ?, 'pending')`
    ) {
      this.outbox.push({
        id: p[0] as string,
        type: p[1] as string,
        payload: p[2] as string,
        created_at: p[3] as number,
        status: 'pending',
        retries: 0,
        last_error: null,
        next_attempt_at: 0,
      });
      return { lastInsertRowId: 0, changes: 1 };
    }

    if (s === 'INSERT OR REPLACE INTO routes_cache (route_date, json, updated_at) VALUES (?, ?, ?)') {
      this.routes.set(p[0] as string, {
        json: p[1] as string,
        updated_at: p[2] as number,
      });
      return { lastInsertRowId: 0, changes: 1 };
    }

    if (s === 'DELETE FROM routes_cache WHERE route_date = ?') {
      const ok = this.routes.delete(p[0] as string);
      return { lastInsertRowId: 0, changes: ok ? 1 : 0 };
    }

    if (
      s ===
      'INSERT OR REPLACE INTO visit_local (parada_id, route_date, check_in_at, check_out_at, next_step, next_note) VALUES (?, ?, ?, ?, ?, ?)'
    ) {
      const row: VisitRow = {
        parada_id: p[0] as string,
        route_date: p[1] as string,
        check_in_at: p[2] as string | null,
        check_out_at: p[3] as string | null,
        next_step: p[4] as string | null,
        next_note: p[5] as string | null,
      };
      this.visits.set(visitKey(row.parada_id, row.route_date), row);
      return { lastInsertRowId: 0, changes: 1 };
    }

    if (
      s ===
      'INSERT OR IGNORE INTO mission_progress (mission_id, current, target, completed, updated_at) VALUES (?, 0, ?, 0, ?)'
    ) {
      const missionId = p[0] as string;
      if (this.missions.has(missionId)) return { lastInsertRowId: 0, changes: 0 };
      this.missions.set(missionId, {
        mission_id: missionId,
        current: 0,
        target: p[1] as number,
        completed: 0,
        updated_at: p[2] as number,
      });
      return { lastInsertRowId: 0, changes: 1 };
    }

    if (s === 'UPDATE game_wallet SET xp = xp + ?, coins = coins + ? WHERE id = 1') {
      this.wallet.xp += p[0] as number;
      this.wallet.coins += p[1] as number;
      return { lastInsertRowId: 0, changes: 1 };
    }

    if (s === 'UPDATE game_wallet SET coins = coins - ? WHERE id = 1') {
      this.wallet.coins -= p[0] as number;
      return { lastInsertRowId: 0, changes: 1 };
    }

    if (s === 'UPDATE mission_progress SET current = ?, completed = ?, updated_at = ? WHERE mission_id = ?') {
      const m = this.missions.get(p[3] as string);
      if (!m) return { lastInsertRowId: 0, changes: 0 };
      m.current = p[0] as number;
      m.completed = p[1] as number;
      m.updated_at = p[2] as number;
      return { lastInsertRowId: 0, changes: 1 };
    }

    if (s === "UPDATE outbox SET status = 'synced', last_error = NULL, next_attempt_at = 0 WHERE id = ?") {
      const row = this.outbox.find((r) => r.id === p[0]);
      if (!row) return { lastInsertRowId: 0, changes: 0 };
      row.status = 'synced';
      row.last_error = null;
      row.next_attempt_at = 0;
      return { lastInsertRowId: 0, changes: 1 };
    }

    if (s === "UPDATE outbox SET status = 'failed', retries = ?, last_error = ?, next_attempt_at = 0 WHERE id = ?") {
      const row = this.outbox.find((r) => r.id === p[2]);
      if (!row) return { lastInsertRowId: 0, changes: 0 };
      row.status = 'failed';
      row.retries = p[0] as number;
      row.last_error = p[1] as string;
      row.next_attempt_at = 0;
      return { lastInsertRowId: 0, changes: 1 };
    }

    if (s === 'UPDATE outbox SET retries = ?, last_error = ?, next_attempt_at = ? WHERE id = ?') {
      const row = this.outbox.find((r) => r.id === p[3]);
      if (!row) return { lastInsertRowId: 0, changes: 0 };
      row.retries = p[0] as number;
      row.last_error = p[1] as string;
      row.next_attempt_at = p[2] as number;
      return { lastInsertRowId: 0, changes: 1 };
    }

    if (
      s ===
      "UPDATE outbox SET status = 'pending', last_error = NULL, next_attempt_at = 0 WHERE status = 'failed'"
    ) {
      let n = 0;
      for (const r of this.outbox) {
        if (r.status === 'failed') {
          r.status = 'pending';
          r.last_error = null;
          r.next_attempt_at = 0;
          n += 1;
        }
      }
      return { lastInsertRowId: 0, changes: n };
    }

    if (
      s ===
      'INSERT INTO store_redemptions (id, reward_id, title, coins_spent, created_at) VALUES (?, ?, ?, ?, ?)'
    ) {
      this.redemptions.push({
        id: p[0] as string,
        reward_id: p[1] as string,
        title: p[2] as string,
        coins_spent: p[3] as number,
        created_at: p[4] as number,
      });
      return { lastInsertRowId: 0, changes: 1 };
    }

    throw new Error(`[webMemoryDb] SQL não suportado: ${s.slice(0, 120)}`);
  }

  getFirstSync<T>(source: string, ...params: SQLiteVariadicBindParams): T | null {
    const p = bindArgs(params);
    const s = norm(source);

    if (s === "SELECT COUNT(*) as c FROM outbox WHERE status = 'pending'") {
      const c = this.outbox.filter((r) => r.status === 'pending').length;
      return { c } as T;
    }

    if (s === "SELECT COUNT(*) as c FROM outbox WHERE status = 'failed'") {
      const c = this.outbox.filter((r) => r.status === 'failed').length;
      return { c } as T;
    }

    if (s === 'SELECT json FROM routes_cache WHERE route_date = ?') {
      const row = this.routes.get(p[0] as string);
      return (row ? { json: row.json } : null) as T | null;
    }

    if (
      s ===
      'SELECT parada_id, route_date, check_in_at, check_out_at, next_step, next_note FROM visit_local WHERE parada_id = ? AND route_date = ?'
    ) {
      return (this.visits.get(visitKey(p[0] as string, p[1] as string)) ?? null) as T | null;
    }

    if (s === 'SELECT xp, coins FROM game_wallet WHERE id = 1') {
      return { xp: this.wallet.xp, coins: this.wallet.coins } as T;
    }

    if (s === 'SELECT current, completed FROM mission_progress WHERE mission_id = ?') {
      const m = this.missions.get(p[0] as string);
      if (!m) return null;
      return { current: m.current, completed: m.completed } as T;
    }

    throw new Error(`[webMemoryDb] getFirstSync não suportado: ${s.slice(0, 120)}`);
  }

  getAllSync<T>(source: string, ...params: SQLiteVariadicBindParams): T[] {
    const p = bindArgs(params);
    const s = norm(source);

    if (
      s ===
      'SELECT id, type, payload, created_at, status, retries, last_error, COALESCE(next_attempt_at, 0) as next_attempt_at FROM outbox ORDER BY created_at DESC LIMIT ?'
    ) {
      const limit = p[0] as number;
      const sorted = [...this.outbox].sort((a, b) => b.created_at - a.created_at).slice(0, limit);
      return sorted.map((r) => ({
        id: r.id,
        type: r.type,
        payload: r.payload,
        created_at: r.created_at,
        status: r.status,
        retries: r.retries,
        last_error: r.last_error,
        next_attempt_at: r.next_attempt_at,
      })) as T[];
    }

    if (
      s ===
      "SELECT id, type, payload, created_at, status, retries, last_error, COALESCE(next_attempt_at, 0) as next_attempt_at FROM outbox WHERE status = 'pending' AND COALESCE(next_attempt_at, 0) <= ? ORDER BY created_at ASC LIMIT 25"
    ) {
      const now = p[0] as number;
      const rows = this.outbox
        .filter((r) => r.status === 'pending' && r.next_attempt_at <= now)
        .sort((a, b) => a.created_at - b.created_at)
        .slice(0, 25);
      return rows.map((r) => ({
        id: r.id,
        type: r.type,
        payload: r.payload,
        created_at: r.created_at,
        status: r.status,
        retries: r.retries,
        last_error: r.last_error,
        next_attempt_at: r.next_attempt_at,
      })) as T[];
    }

    if (s === 'SELECT mission_id, current, target, completed FROM mission_progress') {
      return [...this.missions.values()] as T[];
    }

    if (s === 'SELECT id, title, coins_spent, created_at FROM store_redemptions ORDER BY created_at DESC LIMIT ?') {
      const limit = p[0] as number;
      return [...this.redemptions]
        .sort((a, b) => b.created_at - a.created_at)
        .slice(0, limit)
        .map((r) => ({
          id: r.id,
          title: r.title,
          coins_spent: r.coins_spent,
          created_at: r.created_at,
        })) as T[];
    }

    throw new Error(`[webMemoryDb] getAllSync não suportado: ${s.slice(0, 120)}`);
  }
}

let singleton: SQLite.SQLiteDatabase | null = null;

export function getWebMemoryDb(): SQLite.SQLiteDatabase {
  if (!singleton) {
    singleton = new WebMemoryDatabase() as unknown as SQLite.SQLiteDatabase;
  }
  return singleton;
}
