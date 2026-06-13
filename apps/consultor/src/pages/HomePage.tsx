import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import { AppIcon } from '@/components/AppIcon';
import { KpiStrip } from '@/components/KpiStrip';
import { LoadingBlock } from '@/components/LoadingBlock';
import { PageHeader } from '@/components/PageHeader';
import { PipelineChart } from '@/components/PipelineChart';
import { AlertList } from '@/components/AlertList';
import { Card } from '@/components/Card';
import { StatCard } from '@/components/StatCard';
import { useAuth } from '@/context/AuthContext';
import { usePullRefresh } from '@/hooks/usePullRefresh';
import { fetchPipeline, fetchRouteDayWithFallback, fetchAlerts, type MgmtAlert } from '@/lib/api';
import { isApiEnabled } from '@/lib/apiConfig';
import { phaseShortLabel, type CommercialPhase } from '@/lib/commercialFunnel';
import { formatWindow, todayIsoDate } from '@/lib/mockData';
import { countByPhase, openPipelineRows } from '@/lib/pipelineStats';
import { inferHubPhase, loadLocalPipeline } from '@/lib/pipelineStore';
import type { RotaDia } from '@rg-ambiental/shared';

export function HomePage() {
  const { user } = useAuth();
  const [route, setRoute] = useState<RotaDia | null>(null);
  const [routeSource, setRouteSource] = useState<'live' | 'mock' | 'error'>('mock');
  const [pipelineOpen, setPipelineOpen] = useState(0);
  const [phaseCounts, setPhaseCounts] = useState(countByPhase([]));
  const [activePhase, setActivePhase] = useState<CommercialPhase>('prospecting');
  const [loading, setLoading] = useState(true);
  const [alerts, setAlerts] = useState<MgmtAlert[]>([]);

  const dateLabel = useMemo(
    () =>
      new Date().toLocaleDateString('pt-BR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      }),
    [],
  );

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    const today = todayIsoDate();
    const [routeRes, apiPipeline, localRows, alertItems] = await Promise.all([
      fetchRouteDayWithFallback(today),
      fetchPipeline().catch(() => []),
      Promise.resolve(loadLocalPipeline()),
      fetchAlerts().catch(() => []),
    ]);

    const merged = [
      ...localRows.map((r) => ({
        id: r.id,
        account: r.account,
        stage: r.stage,
        phase: r.phase,
        owner: r.owner,
        value: r.value,
        updatedAt: r.updatedAt,
      })),
      ...apiPipeline.filter((a) => !localRows.some((l) => l.id === a.id)),
    ];
    const open = openPipelineRows(merged);

    setRoute(routeRes.route);
    setRouteSource(routeRes.source);
    setPipelineOpen(open.length);
    setPhaseCounts(countByPhase(open));
    setActivePhase(inferHubPhase(localRows));
    setAlerts(alertItems);
    setLoading(false);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await loadDashboard();
      if (cancelled) return;
    })();
    return () => {
      cancelled = true;
    };
  }, [loadDashboard]);

  const pull = usePullRefresh({ onRefresh: loadDashboard });

  const nextStop = route?.stops[0];
  const firstName = user?.displayName?.split(' ')[0] ?? 'consultor';
  const stopCount = route?.stops.length ?? 0;

  return (
    <div
      className="page page--pullable"
      onTouchStart={pull.handlers.onTouchStart}
      onTouchMove={pull.handlers.onTouchMove}
      onTouchEnd={pull.handlers.onTouchEnd}>
      {(pull.pullDistance > 0 || pull.refreshing) && (
        <div
          className={`pull-indicator${pull.pulling ? ' pull-indicator--ready' : ''}${pull.refreshing ? ' pull-indicator--active' : ''}`}
          style={{ height: pull.refreshing ? 40 : Math.min(pull.pullDistance, 56) }}>
          <span className="pull-indicator__icon">
            {pull.refreshing ? (
              <span className="pull-indicator__spin" aria-hidden />
            ) : (
              <AppIcon name="leaf" size={18} />
            )}
          </span>
          <span className="pull-indicator__text">
            {pull.refreshing ? 'Atualizando…' : pull.pulling ? 'Solte para atualizar' : 'Puxe para atualizar'}
          </span>
        </div>
      )}

      <PageHeader
        eyebrow="Painel do dia"
        title={`Olá, ${firstName}`}
        subtitle="Sua central de campo — rota, funil e próximos passos num só lugar."
        action={<span className="date-chip">📅 {dateLabel}</span>}
      />

      {routeSource === 'error' ? (
        <div className="banner banner--warn">
          <AppIcon name="alert" size={18} /> Não foi possível atualizar a rota. Exibindo dados de referência.
        </div>
      ) : null}

      {loading ? (
        <LoadingBlock lines={4} label="Montando seu painel…" />
      ) : (
        <>
          <KpiStrip
            items={[
              {
                id: 'stops',
                label: 'Paradas hoje',
                value: String(stopCount),
                hint: nextStop?.accountName ?? 'Sem visitas',
                icon: <AppIcon name="map" size={20} />,
                tone: 'brand',
              },
              {
                id: 'pipeline',
                label: 'Pipeline',
                value: String(pipelineOpen),
                hint: 'Oportunidades em aberto',
                icon: <AppIcon name="chart" size={20} />,
                tone: 'accent',
              },
              {
                id: 'phase',
                label: 'Fase ativa',
                value: phaseShortLabel(activePhase),
                hint: 'Sugestão do funil',
                icon: <AppIcon name="briefcase" size={20} />,
              },
              {
                id: 'sync',
                label: 'Conexão',
                value: isApiEnabled() && routeSource === 'live' ? 'Online' : 'Local',
                hint: isApiEnabled() ? 'API configurada' : 'Modo demonstração',
                icon: <AppIcon name="leaf" size={20} />,
              },
            ]}
          />

          <AlertList items={alerts} />

          <div className="grid-2">
            <div className="stack">
              <StatCard
                accent="forest"
                icon="map"
                title="Próxima parada"
                value={nextStop?.accountName ?? 'Sem paradas'}
                hint={
                  nextStop
                    ? `${nextStop.addressLine} · ${formatWindow(nextStop.windowStart, nextStop.windowEnd)}`
                    : 'Nenhuma visita agendada para hoje'
                }
                to="/agenda"
                actionLabel="Ver agenda completa"
              />

              <Card elevated>
                <h3 className="section-title">Rota de hoje</h3>
                <div className="timeline">
                  {route?.stops.map((s, i) => (
                    <div key={s.id} className="timeline__item">
                      <span className="timeline__dot">{i + 1}</span>
                      <div>
                        <p className="timeline__title">{s.accountName}</p>
                        <p className="timeline__meta">{formatWindow(s.windowStart, s.windowEnd)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            <div className="stack">
              <PipelineChart counts={phaseCounts} total={pipelineOpen} />

              <StatCard
                icon="briefcase"
                title="Kit comercial"
                value="4 fases"
                hint="Prospecção → Proposta → Aceite → Contrato"
                to="/comercial"
                actionLabel="Abrir funil"
              />

              <Card elevated className="ios-group-card">
                <h3 className="section-title">Atalhos</h3>
                <div className="chip-row">
                  <Link to="/comercial/proposta" className="chip">
                    Nova proposta
                  </Link>
                  <Link to="/comercial/clientes" className="chip">
                    Clientes
                  </Link>
                  <Link to="/comercial/pipeline" className="chip">
                    Pipeline
                  </Link>
                </div>
              </Card>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
