import type { RotaDia } from '@rg-ambiental/shared';

import { apiFetch } from './apiClient';
import { isApiEnabled } from './apiConfig';
import type { CommercialPhase } from './commercialFunnel';
import { getDefaultRouteToday } from './mockData';

export type PipelineRow = {
  id: string;
  account: string;
  stage: string;
  phase: CommercialPhase;
  owner: string;
  value: string;
  docPending?: string;
  updatedAt: number;
};

let tokenProvider: (() => string | null) | null = null;

export function setApiTokenProvider(fn: () => string | null): void {
  tokenProvider = fn;
}

function token(): string | null {
  return tokenProvider?.() ?? null;
}

async function fetchPipelineMock(): Promise<PipelineRow[]> {
  await new Promise((r) => setTimeout(r, 80));
  const now = Date.now();
  return [
    {
      id: 'mock-metalurgica',
      account: 'Metalúrgica Horizonte',
      stage: 'Diagnóstico resíduos classe I',
      phase: 'prospecting',
      owner: 'Você',
      value: 'R$ 180k ARR estimado',
      docPending: 'Licença de operação',
      updatedAt: now - 86_400_000,
    },
    {
      id: 'mock-andorinha',
      account: 'Química Andorinha',
      stage: 'Proposta — logística reversa',
      phase: 'proposal',
      owner: 'Você',
      value: 'Aguardando MTR',
      docPending: 'MTR em análise',
      updatedAt: now - 43_200_000,
    },
    {
      id: 'mock-foodco',
      account: 'FoodCo Brasil',
      stage: 'Renovação anual',
      phase: 'contract',
      owner: 'CS — Patrícia',
      value: 'Contrato ativo',
      updatedAt: now - 10_800_000,
    },
  ];
}

export async function fetchRouteDay(date: string): Promise<RotaDia> {
  if (!isApiEnabled()) {
    await new Promise((r) => setTimeout(r, 120));
    const { routeForDate } = await import('./mockData');
    return routeForDate(date);
  }
  return apiFetch<RotaDia>(`/me/routes/${date}`, { token: token() });
}

export async function fetchRouteDayWithFallback(date: string): Promise<{
  route: RotaDia;
  source: 'live' | 'mock' | 'error';
}> {
  try {
    const route = await fetchRouteDay(date);
    return { route, source: isApiEnabled() ? 'live' : 'mock' };
  } catch {
    if (isApiEnabled()) return { route: getDefaultRouteToday(), source: 'error' };
    return { route: getDefaultRouteToday(), source: 'mock' };
  }
}

export async function fetchPipeline(): Promise<PipelineRow[]> {
  if (!isApiEnabled()) return fetchPipelineMock();
  const data = await apiFetch<{ rows: PipelineRow[] }>('/me/pipeline', { token: token() });
  return data.rows;
}

export type ClientRow = {
  id: string;
  company: string;
  contact?: string;
  email?: string;
  phone?: string;
  segment?: string;
  updatedAt?: number;
};

type ApiClientRow = {
  id: string;
  company: string;
  contactName?: string;
  contact?: string;
  email?: string;
  phone?: string;
  segment?: string;
  updatedAt?: number;
};

export async function fetchClients(): Promise<ClientRow[]> {
  if (!isApiEnabled()) {
    return [
      { id: 'c1', company: 'ACME Indústria Ltda.', contact: 'João Silva', segment: 'Indústria' },
      { id: 'c2', company: 'Logística Verde S.A.', contact: 'Maria Costa', segment: 'Logística' },
    ];
  }
  const data = await apiFetch<{ rows: ApiClientRow[] }>('/me/clients', { token: token() });
  return (data.rows ?? []).map((r) => ({
    id: r.id,
    company: r.company,
    contact: r.contactName ?? r.contact,
    email: r.email,
    phone: r.phone,
    segment: r.segment,
    updatedAt: r.updatedAt,
  }));
}

export async function syncEvents(events: unknown[]): Promise<{ accepted: string[]; rejected: { id: string; reason: string }[] }> {
  if (!isApiEnabled()) {
    await new Promise((r) => setTimeout(r, 200));
    const ids = (events as { id?: string }[]).map((e) => String(e.id ?? '')).filter(Boolean);
    return { accepted: ids, rejected: [] };
  }
  return apiFetch<{ accepted: string[]; rejected: { id: string; reason: string }[] }>('/sync/events', {
    method: 'POST',
    token: token(),
    body: { events },
  });
}

export type MgmtAlert = {
  id: string;
  severity: 'info' | 'warning' | 'danger';
  title: string;
  body: string;
};

export async function fetchAlerts(): Promise<MgmtAlert[]> {
  if (!isApiEnabled()) return [];
  const data = await apiFetch<{ items: MgmtAlert[] }>('/me/alerts', { token: token() });
  return data.items ?? [];
}

export type MasterDashboard = {
  kpis: { visitsWeek: number; contractsMonth: number; avgXp: number };
  team: Array<{
    id: string;
    name: string;
    visitsWeek: number;
    proposalsWeek: number;
    contractsMonth: number;
    status: string;
    lastSyncLabel: string;
    xp: number;
  }>;
  pipelineOpen: number;
};

export async function fetchMasterDashboard(): Promise<MasterDashboard> {
  return apiFetch<MasterDashboard>('/master/dashboard', { token: token() });
}
