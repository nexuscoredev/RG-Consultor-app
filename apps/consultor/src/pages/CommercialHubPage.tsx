import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import { AppIcon } from '@/components/AppIcon';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { FunnelRail } from '@/components/FunnelRail';
import { PageHeader } from '@/components/PageHeader';
import { useSwipePhases } from '@/hooks/useSwipePhases';
import {
  FUNNEL_HUB,
  getPhaseConfig,
  type CommercialPhase,
} from '@/lib/commercialFunnel';
import { fetchPipeline } from '@/lib/api';
import { nextPhase, prevPhase } from '@/lib/phaseNav';
import { countByPhase, openPipelineRows } from '@/lib/pipelineStats';
import { loadLocalPipeline, inferHubPhase } from '@/lib/pipelineStore';

export function CommercialHubPage() {
  const [activePhase, setActivePhase] = useState<CommercialPhase>('prospecting');
  const [activeCompany, setActiveCompany] = useState<string | null>(null);
  const [phaseCounts, setPhaseCounts] = useState(countByPhase([]));

  const reload = useCallback(async () => {
    const localRows = loadLocalPipeline();
    const apiRows = await fetchPipeline().catch(() => []);
    const merged = [
      ...localRows,
      ...apiRows.filter((a) => !localRows.some((l) => l.id === a.id)),
    ];
    const open = openPipelineRows(merged);
    setActivePhase(inferHubPhase(localRows));
    setPhaseCounts(countByPhase(open));
    const active = open.find((r) => !/contrato ativo|renovação anual/i.test(r.stage));
    setActiveCompany(active?.account ?? null);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await reload();
      if (cancelled) return;
    })();
    return () => {
      cancelled = true;
    };
  }, [reload]);

  const swipe = useSwipePhases({ phase: activePhase, onPhase: setActivePhase });
  const phase = getPhaseConfig(activePhase);
  const totalTools = useMemo(() => phase.tools.length, [phase]);
  const canPrev = prevPhase(activePhase) != null;
  const canNext = nextPhase(activePhase) != null;

  return (
    <div className="page">
      <PageHeader
        eyebrow="Ciclo comercial"
        title="Funil RG"
        subtitle="Fluxo guiado em quatro fases — do diagnóstico ao contrato fechado."
        action={
          <Link to="/comercial/clientes" className="btn-link">
            <Button variant="secondary">Clientes</Button>
          </Link>
        }
      />

      <div
        className="funnel-swipe-zone"
        onTouchStart={swipe.onTouchStart}
        onTouchEnd={swipe.onTouchEnd}>
        <div className="funnel-swipe-zone__nav">
          <button
            type="button"
            className="funnel-swipe-zone__arrow"
            disabled={!canPrev}
            onClick={() => {
              const p = prevPhase(activePhase);
              if (p) setActivePhase(p);
            }}
            aria-label="Fase anterior">
            <AppIcon name="chevron-left" size={18} />
          </button>
          <FunnelRail activePhase={activePhase} onSelect={setActivePhase} counts={phaseCounts} />
          <button
            type="button"
            className="funnel-swipe-zone__arrow"
            disabled={!canNext}
            onClick={() => {
              const n = nextPhase(activePhase);
              if (n) setActivePhase(n);
            }}
            aria-label="Próxima fase">
            <AppIcon name="chevron-right" size={18} />
          </button>
        </div>
        <p className="funnel-swipe-hint">Deslize para mudar de fase no celular</p>
      </div>

      {activeCompany ? (
        <div className="highlight-card">
          <p className="highlight-card__label">Continuar com</p>
          <p className="highlight-card__title">{activeCompany}</p>
          <Link to={`/comercial/prospecao?company=${encodeURIComponent(activeCompany)}`} className="btn-link">
            <Button variant="secondary" fullWidth>
              Retomar visita
            </Button>
          </Link>
        </div>
      ) : null}

      <div className="action-row">
        <Link to="/comercial/clientes" className="btn-link">
          <Button variant="primary" fullWidth>
            Clientes
          </Button>
        </Link>
        <Link to="/comercial/pipeline" className="btn-link">
          <Button variant="secondary" fullWidth>
            Pipeline
          </Button>
        </Link>
        <Link to="/comercial/proposta" className="btn-link">
          <Button variant="ghost" fullWidth>
            Nova proposta
          </Button>
        </Link>
      </div>

      <Card elevated className="card--accent">
        <p className="highlight-card__label">{totalTools} ferramentas nesta fase</p>
        <h2 className="section-title">{phase.title}</h2>
        <p style={{ margin: '0 0 16px', color: 'var(--ink-muted)', lineHeight: 1.5 }}>{phase.subtitle}</p>
        <Link to={phase.primaryPath} className="btn-link">
          <Button variant="primary" fullWidth>
            {phase.primaryLabel}
          </Button>
        </Link>
      </Card>

      <div className="tool-grid">
        {phase.tools.map((tool) => (
          <Link key={tool.path} to={tool.path} className="tool-link">
            {tool.label}
          </Link>
        ))}
      </div>

      <Card>
        <h3 className="section-title">Mapa do funil</h3>
        {FUNNEL_HUB.map((p) => (
          <div key={p.phase} className="pipeline-row">
            <strong>{p.title}</strong>
            <span style={{ color: 'var(--ink-muted)', fontSize: '0.9rem' }}>
              {phaseCounts[p.phase] ?? 0} no pipeline · {p.tools.length} ferramentas
            </span>
            <Button variant="ghost" onClick={() => setActivePhase(p.phase)}>
              Explorar fase
            </Button>
          </div>
        ))}
      </Card>
    </div>
  );
}
