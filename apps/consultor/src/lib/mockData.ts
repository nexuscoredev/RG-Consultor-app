import type { Parada, RotaDia } from '@rg-ambiental/shared';

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
    id = crypto.randomUUID();
    routeIdByDate.set(isoDate, id);
  }
  return id;
}

export function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

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
  return { id: rid, date: isoDate, sellerId, stops };
}

export function getDefaultRouteToday(): RotaDia {
  return routeForDate(todayIsoDate());
}

export function formatWindow(start: string, end: string): string {
  const fmt = (iso: string) =>
    new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  return `${fmt(start)} – ${fmt(end)}`;
}

export function googleMapsUrl(stop: Parada): string {
  const [lng, lat] = stop.geo.coordinates;
  const q = encodeURIComponent(`${stop.addressLine}, ${stop.city}`);
  if (Number.isFinite(lat) && Number.isFinite(lng)) {
    return `https://www.google.com/maps/search/?api=1&query=${q}`;
  }
  return `https://www.google.com/maps/search/?api=1&query=${q}`;
}

export function routeDirectionsUrl(route: RotaDia): string | null {
  const coords = route.stops
    .map((s: Parada) => {
      const [lng, lat] = s.geo.coordinates;
      return Number.isFinite(lat) && Number.isFinite(lng) ? `${lat},${lng}` : null;
    })
    .filter((x: string | null): x is string => x != null);
  if (coords.length === 0) return null;
  if (coords.length === 1) return `https://www.google.com/maps/dir/?api=1&destination=${coords[0]}`;
  const destination = coords[coords.length - 1];
  const waypoints = coords.slice(0, -1).join('|');
  return `https://www.google.com/maps/dir/?api=1&destination=${destination}&waypoints=${waypoints}`;
}
