export type MockSellerRow = {
  id: string;
  name: string;
  region: string;
  profile: string;
  xp: number;
  coins: number;
  visitsWeek: number;
  proposalsWeek: number;
  contractsMonth: number;
  lastSyncLabel: string;
  status: 'em_visita' | 'em_rota' | 'sync_ok' | 'offline';
};

export const MOCK_SELLER_TEAM: MockSellerRow[] = [
  {
    id: 's1',
    name: 'Ana Ribeiro',
    region: 'SP — Capital',
    profile: 'Sênior',
    xp: 8420,
    coins: 520,
    visitsWeek: 8,
    proposalsWeek: 4,
    contractsMonth: 3,
    lastSyncLabel: 'há 2 min',
    status: 'em_visita',
  },
  {
    id: 's2',
    name: 'Marcos Teixeira',
    region: 'SP — ABC',
    profile: 'Sênior',
    xp: 6100,
    coins: 380,
    visitsWeek: 6,
    proposalsWeek: 2,
    contractsMonth: 2,
    lastSyncLabel: 'há 18 min',
    status: 'em_rota',
  },
  {
    id: 's3',
    name: 'Carlos Mota',
    region: 'SP — Interior',
    profile: 'Pleno',
    xp: 2980,
    coins: 190,
    visitsWeek: 5,
    proposalsWeek: 1,
    contractsMonth: 1,
    lastSyncLabel: 'há 1 h',
    status: 'sync_ok',
  },
  {
    id: 's4',
    name: 'Juliana Prado',
    region: 'RJ',
    profile: 'Pleno',
    xp: 1450,
    coins: 95,
    visitsWeek: 4,
    proposalsWeek: 2,
    contractsMonth: 0,
    lastSyncLabel: 'há 4 h',
    status: 'offline',
  },
];
