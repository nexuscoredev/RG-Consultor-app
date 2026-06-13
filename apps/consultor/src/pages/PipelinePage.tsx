import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { AppIcon } from '@/components/AppIcon';
import { BackLink } from '@/components/BackLink';
import { Card } from '@/components/Card';
import { EmptyState } from '@/components/EmptyState';
import { LoadingBlock } from '@/components/LoadingBlock';
import { PageHeader } from '@/components/PageHeader';
import { PhaseBadge } from '@/components/PhaseBadge';
import { fetchPipeline, type PipelineRow } from '@/lib/api';
import { COMMERCIAL_PHASE_ORDER, phaseShortLabel, type CommercialPhase } from '@/lib/commercialFunnel';
import { loadLocalPipeline } from '@/lib/pipelineStore';

function formatUpdated(at?: number): string {
  if (!at) return '';
  return new Date(at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

export function PipelinePage() {
  const navigate = useNavigate();
  const [rows, setRows] = useState<PipelineRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<CommercialPhase | 'all'>('all');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [apiRows, localRows] = await Promise.all([
        fetchPipeline().catch(() => []),
        Promise.resolve(loadLocalPipeline()),
      ]);
      if (cancelled) return;
      const merged = [
        ...localRows.map((r) => ({
          id: r.id,
          account: r.account,
          stage: r.stage,
          phase: r.phase,
          owner: r.owner,
          value: r.value,
          docPending: r.docPending,
          updatedAt: r.updatedAt,
        })),
        ...apiRows.filter((a) => !localRows.some((l) => l.id === a.id)),
      ];
      setRows(merged);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(
    () => (filter === 'all' ? rows : rows.filter((r) => r.phase === filter)),
    [rows, filter],
  );

  return (
    <div className="page">
      <BackLink to="/comercial" label="Voltar ao funil" />

      <PageHeader
        eyebrow="CRM de campo"
        title="Pipeline"
        subtitle="Oportunidades por fase — filtre e acompanhe documentação pendente."
      />

      <div className="chip-row">
        <button
          type="button"
          className={`chip chip--button${filter === 'all' ? ' chip--active' : ''}`}
          onClick={() => setFilter('all')}>
          Todas ({rows.length})
        </button>
        {COMMERCIAL_PHASE_ORDER.map((p) => (
          <button
            key={p}
            type="button"
            className={`chip chip--button${filter === p ? ' chip--active' : ''}`}
            onClick={() => setFilter(p)}>
            {phaseShortLabel(p)}
          </button>
        ))}
      </div>

      {loading ? (
        <LoadingBlock label="Carregando oportunidades…" />
      ) : filtered.length === 0 ? (
        <Card elevated>
          <EmptyState
            lottie="box"
            title="Nenhuma oportunidade"
            description={
              filter === 'all'
                ? 'Comece pelo funil comercial ou gere uma proposta para criar a primeira entrada.'
                : `Não há oportunidades na fase ${phaseShortLabel(filter)}.`
            }
            actionLabel="Abrir funil comercial"
            onAction={() => navigate('/comercial')}
          />
        </Card>
      ) : (
        <div className="pipeline-grid">
          {filtered.map((row) => (
            <article key={row.id} className="pipeline-card">
              <div className="pipeline-card__head">
                <h3 className="pipeline-card__title">{row.account}</h3>
                <PhaseBadge phase={row.phase} />
              </div>
              <p className="pipeline-card__stage">{row.stage}</p>
              <p className="pipeline-card__value">{row.value}</p>
              {row.docPending ? (
                <p className="pipeline-card__pending">
                  <AppIcon name="alert" size={16} /> {row.docPending}
                </p>
              ) : null}
              <div className="pipeline-card__foot">
                <span>{row.owner}</span>
                {row.updatedAt ? <span>Atualizado {formatUpdated(row.updatedAt)}</span> : null}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
