import type { PipelineRow, SyncEventInput } from './seed.js';
import { SEED_PIPELINE, SEED_TEAM, type MasterTeamRow } from './seed.js';
import { loadStoreSnapshot, saveStoreSnapshot, type SellerStatsSnapshot } from './persist.js';

type SellerStats = {
  visitsWeek: number;
  proposalsWeek: number;
  contractsMonth: number;
  lastSyncAt: number | null;
  status: MasterTeamRow['status'];
};

const syncedIds = new Set<string>();
const pipelineByAccount = new Map<string, PipelineRow>();
const sellerStats = new Map<string, SellerStats>();

function hydrateFromSeed() {
  for (const row of SEED_PIPELINE) {
    pipelineByAccount.set(row.account.toLowerCase(), { ...row });
  }
  for (const member of SEED_TEAM) {
    sellerStats.set(member.id, {
      visitsWeek: member.visitsWeek,
      proposalsWeek: member.proposalsWeek,
      contractsMonth: member.contractsMonth,
      lastSyncAt: Date.now() - 60_000,
      status: member.status,
    });
  }
}

function hydrateFromSnapshot(snapshot: ReturnType<typeof loadStoreSnapshot>) {
  if (!snapshot) {
    hydrateFromSeed();
    return;
  }
  for (const id of snapshot.syncedIds) syncedIds.add(id);
  for (const row of snapshot.pipeline) {
    pipelineByAccount.set(row.account.toLowerCase(), { ...row });
  }
  for (const [id, stats] of Object.entries(snapshot.sellerStats)) {
    sellerStats.set(id, {
      visitsWeek: stats.visitsWeek,
      proposalsWeek: stats.proposalsWeek,
      contractsMonth: stats.contractsMonth,
      lastSyncAt: stats.lastSyncAt,
      status: stats.status as MasterTeamRow['status'],
    });
  }
}

hydrateFromSnapshot(loadStoreSnapshot());

function persistState(): void {
  const statsObj: Record<string, SellerStatsSnapshot> = {};
  for (const [id, stats] of sellerStats.entries()) {
    statsObj[id] = { ...stats };
  }
  saveStoreSnapshot({
    syncedIds: [...syncedIds],
    pipeline: [...pipelineByAccount.values()],
    sellerStats: statsObj,
  });
}

function relTime(ms: number | null): string {
  if (!ms) return '—';
  const diff = Date.now() - ms;
  if (diff < 60_000) return 'há instantes';
  if (diff < 3600_000) return `há ${Math.round(diff / 60_000)} min`;
  return `há ${Math.round(diff / 3600_000)} h`;
}

export function recordSyncEvents(sellerId: string, events: SyncEventInput[]): { accepted: string[]; rejected: { id: string; reason: string }[] } {
  const accepted: string[] = [];
  const rejected: { id: string; reason: string }[] = [];

  let stats = sellerStats.get(sellerId);
  if (!stats) {
    stats = { visitsWeek: 0, proposalsWeek: 0, contractsMonth: 0, lastSyncAt: null, status: 'sync_ok' };
    sellerStats.set(sellerId, stats);
  }

  let changed = false;

  for (const ev of events) {
    if (syncedIds.has(ev.id)) {
      accepted.push(ev.id);
      continue;
    }

    try {
      if (ev.type === 'CHECK_IN') {
        stats.visitsWeek += 1;
        stats.status = 'em_visita';
      } else if (ev.type === 'CHECK_OUT') {
        stats.status = 'em_rota';
      } else if (ev.type === 'PROPOSAL_SENT') {
        stats.proposalsWeek += 1;
        const p = ev.payload as { company?: string; value?: string; proposalNumber?: string };
        if (p.company) {
          pipelineByAccount.set(p.company.toLowerCase(), {
            account: p.company,
            stage: 'Proposta enviada',
            owner: 'Consultor Demo',
            value: p.value ?? 'Valor a confirmar',
            docPending: p.proposalNumber ? `Ref. ${p.proposalNumber}` : undefined,
          });
        }
      } else if (ev.type === 'MEETING_LOG') {
        const m = ev.payload as { client?: string; nextAction?: string; nextDate?: string };
        if (m.client) {
          pipelineByAccount.set(m.client.toLowerCase(), {
            account: m.client,
            stage: m.nextAction?.trim() || 'Registo de visita',
            owner: 'Consultor Demo',
            value: m.nextDate?.trim() ? `${m.nextAction ?? 'Follow-up'} · ${m.nextDate}` : m.nextAction ?? 'Aguardando',
          });
        }
      } else if (ev.type === 'CONTRACT_CLOSED') {
        stats.contractsMonth += 1;
        const c = ev.payload as { company?: string; value?: string; term?: string; cnpj?: string; service?: string };
        if (c.company) {
          const valueLabel =
            c.value && c.term ? `R$ ${c.value}/mês · ${c.term}` : c.value ? `R$ ${c.value}/mês` : 'Valor contratado';
          pipelineByAccount.set(c.company.toLowerCase(), {
            account: c.company,
            stage: 'Contrato fechado',
            owner: 'Consultor Demo',
            value: valueLabel,
            docPending: c.cnpj ? `CNPJ ${c.cnpj}` : undefined,
          });
        }
      } else {
        rejected.push({ id: ev.id, reason: `Tipo não suportado: ${ev.type}` });
        continue;
      }

      syncedIds.add(ev.id);
      stats.lastSyncAt = Date.now();
      stats.status = 'sync_ok';
      accepted.push(ev.id);
      changed = true;
    } catch {
      rejected.push({ id: ev.id, reason: 'payload_invalido' });
    }
  }

  if (changed) persistState();

  return { accepted, rejected };
}

export function listPipeline(): PipelineRow[] {
  return [...pipelineByAccount.values()];
}

export function getMasterDashboard() {
  const team = SEED_TEAM.map((m) => {
    const s = sellerStats.get(m.id);
    return {
      ...m,
      visitsWeek: s?.visitsWeek ?? m.visitsWeek,
      proposalsWeek: s?.proposalsWeek ?? m.proposalsWeek,
      contractsMonth: s?.contractsMonth ?? m.contractsMonth,
      status: s?.status ?? m.status,
      lastSyncLabel: relTime(s?.lastSyncAt ?? null),
    };
  });

  const totalVisits = team.reduce((a, r) => a + r.visitsWeek, 0);
  const totalContracts = team.reduce((a, r) => a + r.contractsMonth, 0);
  const avgXp = Math.round(team.reduce((a, r) => a + r.xp, 0) / team.length);

  return {
    kpis: {
      visitsWeek: totalVisits,
      contractsMonth: totalContracts,
      avgXp,
    },
    team,
    pipelineOpen: listPipeline().filter((r) => !/contrato fechado|contrato ativo/i.test(r.stage)).length,
  };
}
