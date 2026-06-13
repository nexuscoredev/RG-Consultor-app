import { useEffect, useState } from 'react';

import { BackLink } from '@/components/BackLink';
import { Card } from '@/components/Card';
import { LoadingBlock } from '@/components/LoadingBlock';
import { PageHeader } from '@/components/PageHeader';
import { useAuth } from '@/context/AuthContext';
import { fetchMasterDashboard, type MasterDashboard } from '@/lib/api';
import { Navigate } from 'react-router-dom';

export function MasterPage() {
  const { user } = useAuth();
  const [data, setData] = useState<MasterDashboard | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.role !== 'master') return;
    let cancelled = false;
    (async () => {
      try {
        const dash = await fetchMasterDashboard();
        if (!cancelled) setData(dash);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.role]);

  if (user?.role !== 'master') return <Navigate to="/" replace />;

  return (
    <div className="page">
      <BackLink to="/" label="Voltar ao painel" />

      <PageHeader
        eyebrow="Gestão"
        title="Painel master"
        subtitle="Visão consolidada da equipe comercial e pipeline aberto."
      />

      {loading ? (
        <LoadingBlock label="Carregando dashboard…" />
      ) : data ? (
        <>
          <div className="kpi-strip">
            <Card className="kpi-card">
              <p className="kpi-card__label">Visitas (semana)</p>
              <p className="kpi-card__value">{data.kpis.visitsWeek}</p>
            </Card>
            <Card className="kpi-card">
              <p className="kpi-card__label">Contratos (mês)</p>
              <p className="kpi-card__value">{data.kpis.contractsMonth}</p>
            </Card>
            <Card className="kpi-card">
              <p className="kpi-card__label">XP médio</p>
              <p className="kpi-card__value">{data.kpis.avgXp}</p>
            </Card>
            <Card className="kpi-card">
              <p className="kpi-card__label">Pipeline aberto</p>
              <p className="kpi-card__value">{data.pipelineOpen}</p>
            </Card>
          </div>

          <Card elevated>
            <h3 className="section-title">Equipe</h3>
            {data.team.map((member) => (
              <div key={member.id} className="pipeline-row">
                <strong>{member.name}</strong>
                <span style={{ color: 'var(--ink-muted)', fontSize: '0.88rem' }}>
                  {member.visitsWeek} visitas · {member.proposalsWeek} propostas · sync {member.lastSyncLabel}
                </span>
                <span className="phase-badge phase-badge--prospecting">{member.status}</span>
              </div>
            ))}
          </Card>
        </>
      ) : null}
    </div>
  );
}
