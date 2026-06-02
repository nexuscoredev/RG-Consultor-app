import type { RotaDia } from '@rg-ambiental/shared';

import { apiFetch } from '@/lib/apiClient';
import { isApiEnabled } from '@/lib/apiConfig';

export type PipelineRow = {
  account: string;
  stage: string;
  owner: string;
  value: string;
  docPending?: string;
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
  return [
    {
      account: 'Metalúrgica Horizonte',
      stage: 'Diagnóstico resíduos classe I',
      owner: 'Você',
      value: 'R$ 180k ARR estimado',
      docPending: 'Licença de operação',
    },
    {
      account: 'Química Andorinha',
      stage: 'Proposta — logística reversa',
      owner: 'Você',
      value: 'Aguardando MTR',
      docPending: 'MTR em análise',
    },
    {
      account: 'FoodCo Brasil',
      stage: 'Renovação anual',
      owner: 'CS — Patrícia',
      value: 'Contrato ativo',
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
