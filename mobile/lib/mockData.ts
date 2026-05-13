import type { Badge, MissionProgress, Parada, RankingEntry, RotaDia } from '@rg-ambiental/shared';

const sellerId = '22222222-2222-2222-2222-222222222222';

function stop(routeDayId: string, p: Omit<Parada, 'routeDayId'>): Parada {
  return { ...p, routeDayId };
}

const stopTemplates: Omit<Parada, 'routeDayId' | 'windowStart' | 'windowEnd'>[] = [
  {
    id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1',
    order: 0,
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
    order: 1,
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
];

const routeIdByDate = new Map<string, string>();

function uuidForDate(isoDate: string): string {
  let id = routeIdByDate.get(isoDate);
  if (!id) {
    id =
      globalThis.crypto?.randomUUID?.() ??
      'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      });
    routeIdByDate.set(isoDate, id);
  }
  return id;
}

/** Rota para uma data ISO (yyyy-mm-dd) — paradas com janelas nesse dia */
export function routeForDate(isoDate: string): RotaDia {
  const rid = uuidForDate(isoDate);
  const stops: Parada[] = [
    stop(rid, {
      ...stopTemplates[0],
      windowStart: `${isoDate}T09:00:00-03:00`,
      windowEnd: `${isoDate}T10:30:00-03:00`,
    }),
    stop(rid, {
      ...stopTemplates[1],
      windowStart: `${isoDate}T14:00:00-03:00`,
      windowEnd: `${isoDate}T15:30:00-03:00`,
    }),
  ];
  return {
    id: rid,
    date: isoDate,
    sellerId,
    stops,
  };
}

/** yyyy-mm-dd no fuso local do aparelho (evita “hoje” errado vs UTC). */
export function toIsoDateLocal(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function todayIsoDate(): string {
  return toIsoDateLocal(new Date());
}

export function getDefaultRouteToday(): RotaDia {
  return routeForDate(todayIsoDate());
}

/** Rotas para API mock (janela de 7 dias centrada em hoje) */
export function buildMockWeekRoutes(): RotaDia[] {
  const out: RotaDia[] = [];
  for (let i = -3; i <= 3; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    out.push(routeForDate(toIsoDateLocal(d)));
  }
  return out;
}

/** @deprecated use getDefaultRouteToday() */
export const mockRotaHoje = routeForDate('2026-05-09');

export const mockMissions: MissionProgress[] = [
  {
    missionId: '33333333-3333-3333-3333-333333333331',
    title: 'Visitas com check-in válido',
    current: 4,
    target: 6,
    unit: 'visits',
  },
  {
    missionId: '33333333-3333-3333-3333-333333333332',
    title: 'Propostas enviadas',
    current: 2,
    target: 3,
    unit: 'proposals',
  },
];

export const missionRulesCopy = [
  'Contam apenas visitas com check-in válido (dentro do geofence) ou com justificativa aprovada pelo gestor.',
  'Propostas enviadas devem estar registradas no CRM até sexta 18h.',
  'Ranking semanal é opt-in; pseudônimo disponível em Configurações.',
  'Evitamos metas puramente punitivas: foco em comportamentos saudáveis e previsíveis.',
];

export const mockBadges: Badge[] = [
  {
    id: '44444444-4444-4444-4444-444444444441',
    slug: 'mestre-sustentabilidade',
    title: 'Mestre da Sustentabilidade',
    description: '100% de check-ins válidos na semana com 5+ visitas.',
    unlockedAt: '2026-05-02T18:00:00-03:00',
  },
  {
    id: '44444444-4444-4444-4444-444444444442',
    slug: 'frota-certificada',
    title: 'Frota Certificada',
    description: 'Apresentou a operação completa para 3 contatos-chave.',
  },
];

export const mockRanking: RankingEntry[] = [
  { sellerId: '55555555-5555-5555-5555-555555555551', displayName: 'Ana R.', weeklyPoints: 420, rank: 1 },
  { sellerId: sellerId, displayName: 'Você', weeklyPoints: 360, rank: 2 },
  { sellerId: '55555555-5555-5555-5555-555555555553', displayName: 'Carlos M.', weeklyPoints: 310, rank: 3 },
];

export const showroomChapters = [
  { id: 'pesagem', label: 'Pesagem', seconds: 0 },
  { id: 'frota', label: 'Frota', seconds: 60 },
  { id: 'certificado', label: 'Descarte certificado', seconds: 300 },
] as const;

/** HLS de teste (Apple sample). No app, o showroom usa MP4 por padrão; HLS é opcional em “Nossa Operação”. */
export const SHOWROOM_HLS_URI =
  'https://devstreaming-cdn.apple.com/videos/streaming/examples/img_bipbop_adv_example_fmp4/master.m3u8';

/** Fallback MP4 se HLS indisponível na plataforma */
export const SHOWROOM_MP4_FALLBACK =
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';

/** Poster leve antes do play */
export const SHOWROOM_POSTER_URI =
  'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4f/Brazilian_flag_icon.png/240px-Brazilian_flag_icon.png';

/** Imagens de vitrine (Unsplash) — demonstração premium na loja de prêmios */
export const STORE_ITEM_IMAGE_URI: Record<string, string> = {
  voucher_100: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=900&q=80',
  day_off: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=900&q=80',
  course_esg: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=900&q=80',
  badge_elite: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=900&q=80',
  coffee_team: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c1?w=900&q=80',
};

export const mockMgmtAlerts = [
  { id: '1', title: 'Rota atrasada', body: 'Janela 09:00 — ACME: considere replanejar ou registrar justificativa.', severity: 'warn' as const },
  { id: '2', title: 'Check-in inválido', body: '2 tentativas fora do raio ontem — revisar com o gestor comercial.', severity: 'danger' as const },
  { id: '3', title: 'Offline prolongado', body: 'Equipe Zona Sul sem sync > 4h — verificar conectividade.', severity: 'info' as const },
];
