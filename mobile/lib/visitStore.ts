import { getDb } from '@/lib/db';

export type VisitLocal = {
  parada_id: string;
  route_date: string;
  check_in_at: string | null;
  check_out_at: string | null;
  next_step: string | null;
  next_note: string | null;
};

export function getVisit(routeDate: string, paradaId: string): VisitLocal | null {
  const database = getDb();
  const row = database.getFirstSync<VisitLocal>(
    `SELECT parada_id, route_date, check_in_at, check_out_at, next_step, next_note FROM visit_local WHERE parada_id = ? AND route_date = ?`,
    paradaId,
    routeDate,
  );
  return row ?? null;
}

function upsert(row: VisitLocal): void {
  const database = getDb();
  database.runSync(
    `INSERT OR REPLACE INTO visit_local (parada_id, route_date, check_in_at, check_out_at, next_step, next_note) VALUES (?, ?, ?, ?, ?, ?)`,
    row.parada_id,
    row.route_date,
    row.check_in_at,
    row.check_out_at,
    row.next_step,
    row.next_note,
  );
}

export function setCheckIn(routeDate: string, paradaId: string, atIso: string): void {
  const cur = getVisit(routeDate, paradaId);
  upsert({
    parada_id: paradaId,
    route_date: routeDate,
    check_in_at: atIso,
    check_out_at: cur?.check_out_at ?? null,
    next_step: cur?.next_step ?? null,
    next_note: cur?.next_note ?? null,
  });
}

export function setCheckOut(routeDate: string, paradaId: string, atIso: string): void {
  const cur = getVisit(routeDate, paradaId);
  upsert({
    parada_id: paradaId,
    route_date: routeDate,
    check_in_at: cur?.check_in_at ?? null,
    check_out_at: atIso,
    next_step: cur?.next_step ?? null,
    next_note: cur?.next_note ?? null,
  });
}

export function setNextStep(routeDate: string, paradaId: string, step: string, note: string): void {
  const cur = getVisit(routeDate, paradaId);
  upsert({
    parada_id: paradaId,
    route_date: routeDate,
    check_in_at: cur?.check_in_at ?? null,
    check_out_at: cur?.check_out_at ?? null,
    next_step: step,
    next_note: note,
  });
}
