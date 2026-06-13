import type { RotaDia } from '@rg-ambiental/shared';

export type ApiUser = {
  email: string;
  password: string;
  role: 'seller' | 'master';
  displayName: string;
  sellerId: string;
  region: string;
};

export type CommercialPhase = 'prospecting' | 'proposal' | 'acceptance' | 'contract';

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

export type SyncEventInput = {
  id: string;
  type: string;
  payload: unknown;
  createdAt: number;
};

export type MasterTeamRow = {
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
};

const SELLER_ID = '22222222-2222-2222-2222-222222222222';

export const DEMO_USERS: ApiUser[] = [
  {
    email: 'vendedor@rg.com',
    password: 'rg2026',
    role: 'seller',
    displayName: 'Consultor Demo',
    sellerId: SELLER_ID,
    region: 'SP — Capital',
  },
  {
    email: 'master@rg.com',
    password: 'rg2026',
    role: 'master',
    displayName: 'Gestor Master',
    sellerId: '33333333-3333-3333-3333-333333333333',
    region: 'Brasil',
  },
];

function uuidForDate(isoDate: string): string {
  return `route-${isoDate.replace(/-/g, '')}-0001`;
}

export function routeForDate(isoDate: string): RotaDia {
  const rid = uuidForDate(isoDate);
  return {
    id: rid,
    date: isoDate,
    sellerId: SELLER_ID,
    stops: [
      {
        id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1',
        routeDayId: rid,
        order: 0,
        windowStart: `${isoDate}T09:00:00-03:00`,
        windowEnd: `${isoDate}T10:30:00-03:00`,
        addressLine: 'Av. Paulista, 1578 — Bela Vista',
        city: 'São Paulo — SP',
        geo: { type: 'Point', coordinates: [-46.655881, -23.561414] },
        geofenceRadiusM: 200,
        accountName: 'ACME Indústria Ltda.',
        contact: {
          id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1',
          name: 'João Silva',
          role: 'Compras / EHS',
          phoneE164: '+5511987654321',
        },
      },
      {
        id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2',
        routeDayId: rid,
        order: 1,
        windowStart: `${isoDate}T14:00:00-03:00`,
        windowEnd: `${isoDate}T15:30:00-03:00`,
        addressLine: 'Rod. Presidente Dutra, km 218',
        city: 'Guarulhos — SP',
        geo: { type: 'Point', coordinates: [-46.533477, -23.454315] },
        geofenceRadiusM: 250,
        accountName: 'Logística Verde S.A.',
        contact: {
          id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb2',
          name: 'Maria Costa',
          role: 'Sustentabilidade',
          phoneE164: '+5511976543210',
        },
      },
    ],
  };
}

export const SEED_PIPELINE: PipelineRow[] = [
  {
    id: 'pipeline-metalurgica-horizonte',
    account: 'Metalúrgica Horizonte',
    stage: 'Diagnóstico resíduos classe I',
    phase: 'prospecting',
    owner: 'Consultor Demo',
    value: 'R$ 180k ARR estimado',
    docPending: 'Licença de operação',
    updatedAt: Date.now() - 86_400_000,
  },
  {
    id: 'pipeline-quimica-andorinha',
    account: 'Química Andorinha',
    stage: 'Proposta — logística reversa',
    phase: 'proposal',
    owner: 'Consultor Demo',
    value: 'Aguardando MTR',
    docPending: 'MTR em análise',
    updatedAt: Date.now() - 43_200_000,
  },
];

export const SEED_TEAM: MasterTeamRow[] = [
  {
    id: SELLER_ID,
    name: 'Consultor Demo',
    profile: 'Consultor comercial',
    region: 'SP — Capital',
    status: 'sync_ok',
    xp: 420,
    coins: 85,
    visitsWeek: 4,
    proposalsWeek: 2,
    contractsMonth: 1,
    lastSyncLabel: 'há instantes',
  },
  {
    id: '44444444-4444-4444-4444-444444444444',
    name: 'Ana R.',
    profile: 'Consultor comercial',
    region: 'SP — Interior',
    status: 'em_visita',
    xp: 380,
    coins: 72,
    visitsWeek: 5,
    proposalsWeek: 1,
    contractsMonth: 0,
    lastSyncLabel: 'há 12 min',
  },
  {
    id: '55555555-5555-5555-5555-555555555555',
    name: 'Carlos M.',
    profile: 'Consultor comercial',
    region: 'RJ',
    status: 'offline',
    xp: 290,
    coins: 40,
    visitsWeek: 2,
    proposalsWeek: 0,
    contractsMonth: 0,
    lastSyncLabel: 'há 2 h',
  },
];
