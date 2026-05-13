import type { RotaDia } from '@rg-ambiental/shared';

export type PipelineRow = {
  account: string;
  stage: string;
  owner: string;
  value: string;
  docPending?: string;
};

/** Simula GET /me/routes/:date — em produção usar fetch com Bearer */
export async function fetchRouteDay(date: string): Promise<RotaDia> {
  const { buildMockWeekRoutes, routeForDate } = await import('@/lib/mockData');
  const routes = buildMockWeekRoutes();
  const hit = routes.find((r) => r.date === date);
  await new Promise((r) => setTimeout(r, 120));
  return hit ?? routeForDate(date);
}

/** Simula CRM / pipeline */
export async function fetchPipeline(): Promise<PipelineRow[]> {
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
