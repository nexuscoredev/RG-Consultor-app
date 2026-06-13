import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { PageHeader } from '@/components/PageHeader';
import { RouteDayMap } from '@/components/RouteDayMap';
import { usePullRefresh } from '@/hooks/usePullRefresh';
import { fetchRouteDayWithFallback } from '@/lib/api';
import { formatWindow, googleMapsUrl, routeDirectionsUrl, todayIsoDate } from '@/lib/mockData';
import type { RotaDia } from '@rg-ambiental/shared';

function visitHref(stop: RotaDia['stops'][0]): string {
  const q = new URLSearchParams({
    company: stop.accountName,
    stopId: stop.id,
    contact: stop.contact.name,
    address: stop.addressLine,
    city: stop.city,
  });
  return `/comercial/visita?${q.toString()}`;
}

export function AgendaPage() {
  const [route, setRoute] = useState<RotaDia | null>(null);
  const [source, setSource] = useState<'live' | 'mock' | 'error'>('mock');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetchRouteDayWithFallback(todayIsoDate());
    setRoute(res.route);
    setSource(res.source);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const pull = usePullRefresh({ onRefresh: load });

  const directions = route ? routeDirectionsUrl(route) : null;
  const dateLabel = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  return (
    <div
      className="page page--pullable"
      onTouchStart={pull.handlers.onTouchStart}
      onTouchMove={pull.handlers.onTouchMove}
      onTouchEnd={pull.handlers.onTouchEnd}>
      <PageHeader
        eyebrow="Visitas"
        title="Agenda"
        subtitle="Paradas do dia com mapa, navegação e modo visita."
        action={<span className="date-chip">📅 {dateLabel}</span>}
      />

      {source === 'error' ? (
        <div className="banner banner--warn">Rota do servidor indisponível — dados de demonstração.</div>
      ) : null}

      {directions ? (
        <a href={directions} target="_blank" rel="noreferrer" className="btn-link">
          <Button variant="primary">Abrir rota completa no Google Maps</Button>
        </a>
      ) : null}

      {loading ? (
        <Card elevated>Carregando paradas…</Card>
      ) : (
        <>
          {route?.stops.length ? (
            <Card elevated>
              <h3 className="section-title">Mapa da rota</h3>
              <RouteDayMap stops={route.stops} />
            </Card>
          ) : null}

          {route?.stops.map((stop, index) => (
            <Card key={stop.id} elevated className="stop-card">
              <p style={{ margin: 0, fontSize: '0.78rem', fontWeight: 800, color: 'var(--forest)' }}>
                PARADA {index + 1}
              </p>
              <h3 className="stop-card__title">{stop.accountName}</h3>
              <p className="stop-card__meta">
                {stop.addressLine} · {stop.city}
              </p>
              <p className="stop-card__meta">
                🕐 {formatWindow(stop.windowStart, stop.windowEnd)} · {stop.contact.name}
              </p>
              <div className="chip-row" style={{ marginTop: 8 }}>
                <Link to={visitHref(stop)} className="btn-link">
                  <Button variant="primary">Modo visita</Button>
                </Link>
                <a href={googleMapsUrl(stop)} target="_blank" rel="noreferrer" className="btn-link">
                  <Button variant="secondary">Abrir no mapa</Button>
                </a>
                {stop.contact.phoneE164 ? (
                  <a href={`tel:${stop.contact.phoneE164}`} className="btn-link">
                    <Button variant="ghost">Ligar</Button>
                  </a>
                ) : null}
              </div>
            </Card>
          ))}
        </>
      )}
    </div>
  );
}
