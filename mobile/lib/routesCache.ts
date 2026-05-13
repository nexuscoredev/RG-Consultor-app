import type { RotaDia } from '@rg-ambiental/shared';
import { RotaDiaSchema } from '@rg-ambiental/shared';
import { getDb } from '@/lib/db';

export function saveRouteToCache(route: RotaDia): void {
  try {
    const database = getDb();
    database.runSync(
      `INSERT OR REPLACE INTO routes_cache (route_date, json, updated_at) VALUES (?, ?, ?)`,
      route.date,
      JSON.stringify(route),
      Date.now(),
    );
  } catch {
    /* evita derrubar fluxo se disco estiver cheio ou DB bloqueado */
  }
}

export function loadRouteFromCache(date: string): RotaDia | null {
  try {
    const database = getDb();
    const row = database.getFirstSync<{ json: string }>(
      `SELECT json FROM routes_cache WHERE route_date = ?`,
      date,
    );
    if (!row?.json) return null;

    let raw: unknown;
    try {
      raw = JSON.parse(row.json);
    } catch {
      database.runSync(`DELETE FROM routes_cache WHERE route_date = ?`, date);
      return null;
    }

    const parsed = RotaDiaSchema.safeParse(raw);
    if (!parsed.success) {
      database.runSync(`DELETE FROM routes_cache WHERE route_date = ?`, date);
      return null;
    }
    return parsed.data;
  } catch {
    return null;
  }
}
