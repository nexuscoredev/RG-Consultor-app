const API_BASE = (import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:3001').replace(/\/$/, '');

export type MasterDashboard = {
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

export type MgmtAlert = {
  id: string;
  severity: 'info' | 'warning' | 'danger';
  title: string;
  body: string;
};

async function loginMaster(): Promise<string> {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'master@rg.com', password: 'rg2026' }),
  });
  if (!res.ok) throw new Error(`login ${res.status}`);
  const data = (await res.json()) as { access_token?: string; accessToken?: string };
  const token = data.access_token ?? data.accessToken;
  if (!token) throw new Error('no token');
  return token;
}

export async function fetchMasterDashboardLive(): Promise<MasterDashboard> {
  const token = await loginMaster();
  const res = await fetch(`${API_BASE}/master/dashboard`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`dashboard ${res.status}`);
  return res.json() as Promise<MasterDashboard>;
}

export async function fetchMasterAlertsLive(): Promise<MgmtAlert[]> {
  const token = await loginMaster();
  const res = await fetch(`${API_BASE}/master/alerts`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`alerts ${res.status}`);
  const data = (await res.json()) as { items: MgmtAlert[] };
  return data.items;
}

export function apiBaseLabel(): string {
  return API_BASE;
}
