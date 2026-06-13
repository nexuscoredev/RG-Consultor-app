import type { RotaDia } from '@rg-ambiental/shared';

import { apiFetch } from '@/lib/apiClient';
import { isApiEnabled } from '@/lib/apiConfig';

import type { CommercialPhase } from '@/lib/commercialFunnel';

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

export type MgmtAlert = {
  id: string;
  severity: 'info' | 'warning' | 'danger';
  title: string;
  body: string;
};

export type MasterDashboardData = {
  kpis: { visitsWeek: number; contractsMonth: number; avgXp: number };
  team: {
    id: string;
    name: string;
    profile: string;
    region: string;
    status: 'em_visita' | 'em_rota' | 'sync_ok' | 'offline';
    xp: number;
    coins: number;
    visitsWeek: number;
    proposalsWeek: number;
    contractsMonth: number;
    lastSyncLabel: string;
  }[];
  pipelineOpen: number;
};

let tokenProvider: (() => string | null) | null = null;

export function setApiTokenProvider(fn: () => string | null): void {
  tokenProvider = fn;
}

function token(): string | null {
  return tokenProvider?.() ?? null;
}

async function fetchRouteDayMock(date: string): Promise<RotaDia> {
  const { buildMockWeekRoutes, routeForDate } = await import('@/lib/mockData');
  const routes = buildMockWeekRoutes();
  const hit = routes.find((r) => r.date === date);
  await new Promise((r) => setTimeout(r, 120));
  return hit ?? routeForDate(date);
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
  if (!isApiEnabled()) return fetchRouteDayMock(date);
  return apiFetch<RotaDia>(`/me/routes/${date}`, { token: token() });
}

export async function fetchPipeline(): Promise<PipelineRow[]> {
  if (!isApiEnabled()) return fetchPipelineMock();
  const data = await apiFetch<{ rows: PipelineRow[] }>('/me/pipeline', { token: token() });
  return data.rows;
}

export async function fetchMasterDashboard(): Promise<MasterDashboardData> {
  return apiFetch<MasterDashboardData>('/master/dashboard', { token: token() });
}

export async function fetchMgmtAlerts(): Promise<MgmtAlert[]> {
  if (!isApiEnabled()) return [];
  const data = await apiFetch<{ items: MgmtAlert[] }>('/master/alerts', { token: token() });
  return data.items;
}

export async function fetchSellerAlerts(): Promise<MgmtAlert[]> {
  if (!isApiEnabled()) return [];
  const data = await apiFetch<{ items: MgmtAlert[] }>('/me/alerts', { token: token() });
  return data.items;
}

export type ApiClientRow = {
  id: string;
  company: string;
  contactName: string;
  segment?: string;
  city?: string;
  phone?: string;
  email?: string;
  cnpj?: string;
  updatedAt: number;
};

export async function fetchClients(): Promise<ApiClientRow[]> {
  if (!isApiEnabled()) return [];
  const data = await apiFetch<{ rows: ApiClientRow[] }>('/me/clients', { token: token() });
  return data.rows ?? [];
}
