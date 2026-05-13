import { getDb } from '@/lib/db';

export type MissionCategory = 'visits' | 'pipeline' | 'contracts' | 'revenue';

export type MissionDef = {
  id: string;
  title: string;
  description: string;
  target: number;
  category: MissionCategory;
  xpReward: number;
  coinReward: number;
};

export const MISSIONS: MissionDef[] = [
  {
    id: 'visits_valid_week',
    title: 'Visitas com check-in válido',
    description: 'Visitas presenciais com check-in válido ou justificativa aprovada.',
    target: 6,
    category: 'visits',
    xpReward: 180,
    coinReward: 35,
  },
  {
    id: 'proposals_sent',
    title: 'Propostas comerciais enviadas',
    description: 'Propostas formais para empresas que podem contratar serviços RG.',
    target: 3,
    category: 'pipeline',
    xpReward: 220,
    coinReward: 45,
  },
  {
    id: 'contracts_closed',
    title: 'Contratos fechados',
    description: 'Contratos assinados com coleta / gerenciamento RG Ambiental.',
    target: 2,
    category: 'contracts',
    xpReward: 500,
    coinReward: 120,
  },
  {
    id: 'mtr_cycles',
    title: 'Ciclos MTR concluídos',
    description: 'Fluxos MTR fechados sem retrabalho na semana.',
    target: 5,
    category: 'pipeline',
    xpReward: 160,
    coinReward: 30,
  },
  {
    id: 'pipeline_value',
    title: 'Pipeline qualificado (R$ mil)',
    description: 'R$ 400 mil em oportunidades qualificadas registradas no CRM.',
    target: 400,
    category: 'revenue',
    xpReward: 300,
    coinReward: 60,
  },
];

export type TierId = 'bronze' | 'prata' | 'ouro' | 'platina' | 'diamante';

export type TierDef = {
  id: TierId;
  label: string;
  minXp: number;
  color: string;
};

export const TIERS: TierDef[] = [
  { id: 'bronze', label: 'Bronze', minXp: 0, color: '#b45309' },
  { id: 'prata', label: 'Prata', minXp: 400, color: '#64748b' },
  { id: 'ouro', label: 'Ouro', minXp: 1200, color: '#ca8a04' },
  { id: 'platina', label: 'Platina', minXp: 3000, color: '#0d9488' },
  { id: 'diamante', label: 'Diamante', minXp: 8000, color: '#6366f1' },
];

export function tierForXp(xp: number): TierDef {
  let t = TIERS[0];
  for (const row of TIERS) {
    if (xp >= row.minXp) t = row;
  }
  return t;
}

export function nextTier(tier: TierDef): TierDef | null {
  const i = TIERS.findIndex((x) => x.id === tier.id);
  return TIERS[i + 1] ?? null;
}

export type StoreItem = {
  id: string;
  title: string;
  description: string;
  costCoins: number;
};

export const STORE_ITEMS: StoreItem[] = [
  { id: 'voucher_100', title: 'Voucher R$ 100', description: 'Desconto em parceiro homologado.', costCoins: 180 },
  { id: 'day_off', title: 'Folga extra (1 dia)', description: 'Sujeito a aprovação de RH.', costCoins: 420 },
  { id: 'course_esg', title: 'Curso ESG premium', description: 'Acesso online 12 meses.', costCoins: 260 },
  { id: 'badge_elite', title: 'Badge Elite RG', description: 'Destaque no ranking interno.', costCoins: 90 },
  { id: 'coffee_team', title: 'Coffee com diretoria', description: 'Agenda trimestral.', costCoins: 550 },
];

export type Wallet = { xp: number; coins: number };

export type MissionState = {
  missionId: string;
  current: number;
  target: number;
  completed: boolean;
};

function newId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
}

function ensureMissionRows(): void {
  const db = getDb();
  for (const m of MISSIONS) {
    db.runSync(
      `INSERT OR IGNORE INTO mission_progress (mission_id, current, target, completed, updated_at) VALUES (?, 0, ?, 0, ?)`,
      m.id,
      m.target,
      Date.now(),
    );
  }
}

export function loadWallet(): Wallet {
  ensureMissionRows();
  const db = getDb();
  const row = db.getFirstSync<{ xp: number; coins: number }>(`SELECT xp, coins FROM game_wallet WHERE id = 1`);
  return { xp: row?.xp ?? 0, coins: row?.coins ?? 0 };
}

export function loadMissionStates(): MissionState[] {
  ensureMissionRows();
  const db = getDb();
  const rows = db.getAllSync<{ mission_id: string; current: number; target: number; completed: number }>(
    `SELECT mission_id, current, target, completed FROM mission_progress`,
  );
  const map = new Map(rows.map((r) => [r.mission_id, r]));
  return MISSIONS.map((m) => {
    const r = map.get(m.id);
    return {
      missionId: m.id,
      current: r?.current ?? 0,
      target: r?.target ?? m.target,
      completed: Boolean(r?.completed),
    };
  });
}

function addWallet(xp: number, coins: number): void {
  const db = getDb();
  db.runSync(`UPDATE game_wallet SET xp = xp + ?, coins = coins + ? WHERE id = 1`, xp, coins);
}

/** Avança missão: XP/moedas ao completar; fatias menores a cada incremento antes do término */
export function bumpMissionProgress(missionId: string, delta: number): void {
  ensureMissionRows();
  const def = MISSIONS.find((m) => m.id === missionId);
  if (!def || delta <= 0) return;
  const db = getDb();
  const row = db.getFirstSync<{ current: number; completed: number }>(
    `SELECT current, completed FROM mission_progress WHERE mission_id = ?`,
    missionId,
  );
  if (!row || row.completed) return;
  const prev = row.current;
  const next = Math.min(def.target, prev + delta);
  const wasComplete = prev >= def.target;
  const nowComplete = next >= def.target;
  db.runSync(
    `UPDATE mission_progress SET current = ?, completed = ?, updated_at = ? WHERE mission_id = ?`,
    next,
    nowComplete ? 1 : 0,
    Date.now(),
    missionId,
  );
  const gained = next - prev;
  if (nowComplete && !wasComplete) {
    addWallet(def.xpReward, def.coinReward);
    return;
  }
  if (gained > 0) {
    const sliceXp = Math.max(6, Math.floor(def.xpReward / def.target));
    const sliceCoins = Math.max(1, Math.floor(def.coinReward / def.target));
    addWallet(sliceXp * gained, sliceCoins * gained);
  }
}

export function recordCheckInValid(): void {
  addWallet(25, 6);
  bumpMissionProgress('visits_valid_week', 1);
}

export function recordCheckInJustified(): void {
  addWallet(12, 3);
  bumpMissionProgress('visits_valid_week', 1);
}

export function recordCheckOut(): void {
  addWallet(18, 4);
}

export function recordPipelineStep(step: string): void {
  if (step === 'proposta') {
    bumpMissionProgress('proposals_sent', 1);
    bumpMissionProgress('pipeline_value', 80);
  } else if (step === 'mtr') {
    bumpMissionProgress('mtr_cycles', 1);
  } else if (step === 'coleta') {
    bumpMissionProgress('contracts_closed', 1);
    bumpMissionProgress('pipeline_value', 120);
  } else {
    addWallet(8, 2);
  }
}

export function demoAdvanceMission(missionId: string, delta: number): void {
  bumpMissionProgress(missionId, delta);
}

export function redeemReward(rewardId: string): { ok: boolean; message: string } {
  const item = STORE_ITEMS.find((s) => s.id === rewardId);
  if (!item) return { ok: false, message: 'Prêmio inválido.' };
  const w = loadWallet();
  if (w.coins < item.costCoins) return { ok: false, message: 'Moedas insuficientes.' };
  const db = getDb();
  db.runSync(`UPDATE game_wallet SET coins = coins - ? WHERE id = 1`, item.costCoins);
  db.runSync(
    `INSERT INTO store_redemptions (id, reward_id, title, coins_spent, created_at) VALUES (?, ?, ?, ?, ?)`,
    newId(),
    item.id,
    item.title,
    item.costCoins,
    Date.now(),
  );
  return { ok: true, message: `Resgatado: ${item.title}` };
}

export type Redemption = { id: string; title: string; coins: number; at: number };

export function loadRedemptions(): Redemption[] {
  const db = getDb();
  return db
    .getAllSync<{ id: string; title: string; coins_spent: number; created_at: number }>(
      `SELECT id, title, coins_spent, created_at FROM store_redemptions ORDER BY created_at DESC LIMIT 30`,
    )
    .map((r) => ({ id: r.id, title: r.title, coins: r.coins_spent, at: r.created_at }));
}

export type LeaderRow = { rank: number; name: string; xp: number; tier: TierId; profile: string };

const BASE_LEADERBOARD: LeaderRow[] = [
  { rank: 1, name: 'Ana Ribeiro', xp: 8420, tier: 'diamante', profile: 'Sênior' },
  { rank: 2, name: 'Marcos Teixeira', xp: 6100, tier: 'platina', profile: 'Sênior' },
  { rank: 3, name: 'Você', xp: 0, tier: 'bronze', profile: 'Consultor' },
  { rank: 4, name: 'Carlos Mota', xp: 2980, tier: 'ouro', profile: 'Pleno' },
  { rank: 5, name: 'Juliana Prado', xp: 1450, tier: 'prata', profile: 'Pleno' },
];

export function leaderboardFor(_scope: 'perfil' | 'regiao_sp' | 'nacional', selfXp: number): LeaderRow[] {
  const rows = BASE_LEADERBOARD.map((r) => ({
    ...r,
    xp: r.name === 'Você' ? selfXp : r.xp,
    tier: tierForXp(r.name === 'Você' ? selfXp : r.xp).id,
  }));
  rows.sort((a, b) => b.xp - a.xp);
  return rows.map((r, idx) => ({ ...r, rank: idx + 1 }));
}
