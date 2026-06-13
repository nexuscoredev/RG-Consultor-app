import type { PipelineRow, SyncEventInput } from './seed.js';
import { SEED_PIPELINE, SEED_TEAM, type MasterTeamRow } from './seed.js';
import { loadStoreSnapshot, saveStoreSnapshot, type SellerStatsSnapshot } from './persist.js';
import { normalizePipelineRow, upsertPipelineRow } from './pipelineUtils.js';

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
const clientsBySeller = new Map<string, import('./persist.js').ClientSnapshot[]>();

function hydrateFromSeed() {
  for (const row of SEED_PIPELINE) {
    pipelineByAccount.set(row.account.toLowerCase(), normalizePipelineRow(row));
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
    pipelineByAccount.set(row.account.toLowerCase(), normalizePipelineRow(row as PipelineRow));
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
  if (snapshot.clientsBySeller) {
    for (const [sellerId, rows] of Object.entries(snapshot.clientsBySeller)) {
      clientsBySeller.set(sellerId, rows);
    }
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
    clientsBySeller: Object.fromEntries(clientsBySeller.entries()),
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
          upsertPipelineRow(pipelineByAccount, {
            account: p.company,
            stage: 'Proposta enviada',
            phase: 'proposal',
            owner: 'Consultor Demo',
            value: p.value ?? 'Valor a confirmar',
            docPending: p.proposalNumber ? `Ref. ${p.proposalNumber}` : undefined,
          });
        }
      } else if (ev.type === 'MEETING_LOG') {
        const m = ev.payload as { client?: string; nextAction?: string; nextDate?: string };
        if (m.client) {
          upsertPipelineRow(pipelineByAccount, {
            account: m.client,
            stage: m.nextAction?.trim() || 'Registo de visita',
            phase: 'prospecting',
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
          upsertPipelineRow(pipelineByAccount, {
            account: c.company,
            stage: 'Contrato fechado',
            phase: 'contract',
            owner: 'Consultor Demo',
            value: valueLabel,
            docPending: c.cnpj ? `CNPJ ${c.cnpj}` : undefined,
          });
        }
      } else if (ev.type === 'CLIENT_SAVED') {
        const cl = ev.payload as {
          id?: string;
          company?: string;
          contactName?: string;
          segment?: string;
          city?: string;
          phone?: string;
          email?: string;
          cnpj?: string;
        };
        if (cl.company && cl.id) {
          const rows = clientsBySeller.get(sellerId) ?? [];
          const idx = rows.findIndex((r) => r.id === cl.id);
          const snap = {
            id: cl.id,
            company: cl.company,
            contactName: cl.contactName ?? '',
            segment: cl.segment,
            city: cl.city,
            phone: cl.phone,
            email: cl.email,
            cnpj: cl.cnpj,
            updatedAt: Date.now(),
          };
          if (idx >= 0) rows[idx] = snap;
          else rows.unshift(snap);
          clientsBySeller.set(sellerId, rows.slice(0, 500));
          upsertPipelineRow(pipelineByAccount, {
            account: cl.company,
            stage: 'Prospecção',
            phase: 'prospecting',
            owner: 'Consultor Demo',
            value: cl.segment?.trim() || 'Cliente cadastrado',
            docPending: cl.cnpj ? `CNPJ ${cl.cnpj}` : cl.contactName ? `Contato: ${cl.contactName}` : undefined,
          });
        }
      } else if (ev.type === 'FOLLOW_UP_SENT') {
        const fu = ev.payload as { company?: string; contactName?: string; phase?: string };
        if (fu.company) {
          upsertPipelineRow(pipelineByAccount, {
            account: fu.company,
            stage: 'Follow-up enviado',
            phase: fu.phase === 'acceptance' ? 'acceptance' : 'proposal',
            owner: 'Consultor Demo',
            value: fu.contactName ? `Contato: ${fu.contactName}` : 'Aguardando retorno',
          });
        }
      } else if (ev.type === 'PROSPECTING_SAVED') {
        const pr = ev.payload as {
          company?: string;
          segment?: string;
          source?: string;
          contactName?: string;
        };
        if (pr.company) {
          const valueParts = [pr.segment?.trim(), pr.source?.trim()].filter(Boolean).join(' · ');
          upsertPipelineRow(pipelineByAccount, {
            account: pr.company,
            stage: 'Prospecção',
            phase: 'prospecting',
            owner: 'Consultor Demo',
            value: valueParts || 'Qualificação em curso',
            docPending: pr.contactName ? `Contato: ${pr.contactName}` : undefined,
          });
        }
      } else if (ev.type === 'PROPOSAL_ACCEPTED') {
        const ac = ev.payload as {
          company?: string;
          proposalNumber?: string;
          acceptedValue?: string;
          acceptanceType?: string;
        };
        if (ac.company) {
          upsertPipelineRow(pipelineByAccount, {
            account: ac.company,
            stage: 'Proposta aceita',
            phase: 'acceptance',
            owner: 'Consultor Demo',
            value: ac.acceptedValue?.trim() || 'Valor aceite',
            docPending: [
              ac.proposalNumber ? `Ref. ${ac.proposalNumber}` : '',
              ac.acceptanceType ? `Aceite: ${ac.acceptanceType}` : '',
            ]
              .filter(Boolean)
              .join(' · ') || undefined,
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
  return [...pipelineByAccount.values()].sort((a, b) => b.updatedAt - a.updatedAt);
}

export function listClientsForSeller(sellerId: string) {
  return [...(clientsBySeller.get(sellerId) ?? [])].sort((a, b) => b.updatedAt - a.updatedAt);
}

export type MgmtAlert = {
  id: string;
  severity: 'info' | 'warning' | 'danger';
  title: string;
  body: string;
};

export function listSellerAlerts(): MgmtAlert[] {
  return listPipeline()
    .filter((r) => r.docPending || /aguardando|mtr/i.test(`${r.stage} ${r.value}`))
    .map((row) => ({
      id: `seller-${row.id}`,
      severity: row.docPending ? ('warning' as const) : ('info' as const),
      title: row.docPending ? `${row.account}: docs pendentes` : `${row.account}: acompanhar`,
      body: row.docPending ?? `${row.stage} — ${row.value}`,
    }))
    .slice(0, 20);
}

export function listMgmtAlerts(): MgmtAlert[] {
  const items: MgmtAlert[] = [];
  for (const row of listPipeline()) {
    if (row.docPending) {
      items.push({
        id: `doc-${row.id}`,
        severity: 'warning',
        title: `${row.account}: documentação pendente`,
        body: row.docPending,
      });
    }
    if (/aguardando|mtr|licença/i.test(row.stage + row.value)) {
      items.push({
        id: `sla-${row.id}`,
        severity: 'info',
        title: `${row.account}: acompanhar SLA`,
        body: `${row.stage} — ${row.value}`,
      });
    }
  }
  for (const member of SEED_TEAM) {
    const s = sellerStats.get(member.id);
    if (s?.status === 'offline') {
      items.push({
        id: `offline-${member.id}`,
        severity: 'danger',
        title: `${member.name} offline`,
        body: `Última sync: ${relTime(s.lastSyncAt)}`,
      });
    }
  }
  return items.slice(0, 25);
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
