import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { PageHeader } from '@/components/PageHeader';
import { BackLink } from '@/components/BackLink';
import { useToast } from '@/context/ToastContext';
import { useSync } from '@/context/SyncContext';
import { draftScopeKey, loadVisitStates, saveVisitState } from '@/lib/commercialStorage';
import { enqueueCheckIn, enqueueCheckOut } from '@/lib/outbox';

export function VisitSessionPage() {
  const toast = useToast();
  const { syncNow } = useSync();
  const [params] = useSearchParams();
  const company = params.get('company') ?? '';
  const stopId = params.get('stopId') ?? draftScopeKey(company);
  const contact = params.get('contact') ?? '';
  const address = params.get('address') ?? '';
  const city = params.get('city') ?? '';

  const [visitState, setVisitState] = useState(() => loadVisitStates()[stopId]);
  const checkedIn = visitState?.checkedInAt && !visitState?.checkedOutAt;

  const suffix = useMemo(() => {
    const q = new URLSearchParams();
    if (company) q.set('company', company);
    if (stopId) q.set('stopId', stopId);
    if (contact) q.set('contact', contact);
    const s = q.toString();
    return s ? `?${s}` : '';
  }, [company, stopId, contact]);

  const checkIn = () => {
    enqueueCheckIn({ stopId, accountName: company });
    const next = { stopId, company, checkedInAt: Date.now() };
    saveVisitState(stopId, next);
    setVisitState(next);
    syncNow();
    toast.push('Check-in registrado.', 'success');
  };

  const checkOut = () => {
    enqueueCheckOut({ stopId, accountName: company });
    const next = {
      stopId,
      company,
      checkedInAt: visitState?.checkedInAt,
      checkedOutAt: Date.now(),
    };
    saveVisitState(stopId, next);
    setVisitState(next);
    syncNow();
    toast.push('Check-out registrado.', 'success');
  };

  if (!company) {
    return (
      <div className="page">
        <BackLink to="/agenda" label="Voltar à agenda" />
        <PageHeader title="Modo visita" subtitle="Selecione uma parada na agenda para iniciar." />
        <Link to="/agenda" className="btn-link">
          <Button variant="primary">Abrir agenda</Button>
        </Link>
      </div>
    );
  }

  const steps = [
    { title: 'Prospecção', hint: 'Diagnóstico inicial', to: `/comercial/prospecao${suffix}` },
    { title: 'Roteiro de visita', hint: 'Checklist na reunião', to: `/comercial/roteiro-visita${suffix}` },
    { title: 'Registro de reunião', hint: 'Notas e próximos passos', to: `/comercial/registro-reuniao${suffix}` },
    { title: 'Checklist docs', hint: 'Documentos a solicitar', to: `/comercial/checklist-docs${suffix}` },
    { title: 'Proposta', hint: 'Gerar PDF', to: `/comercial/proposta?company=${encodeURIComponent(company)}` },
    { title: 'Follow-up', hint: 'Mensagens modelo', to: `/comercial/followup${suffix}` },
  ];

  return (
    <div className="page">
      <BackLink to="/agenda" label="Voltar à agenda" />

      <PageHeader
        eyebrow="Modo visita"
        title={company}
        subtitle={[address, city, contact].filter(Boolean).join(' · ') || 'Fluxo guiado de campo'}
      />

      <Card elevated className="card--accent">
        <div className="visit-actions">
          {!checkedIn ? (
            <Button variant="primary" onClick={checkIn}>Check-in na visita</Button>
          ) : (
            <Button variant="secondary" onClick={checkOut}>Check-out</Button>
          )}
          {visitState?.checkedInAt ? (
            <span className="visit-status">
              {visitState.checkedOutAt ? 'Visita concluída' : 'Em visita'}
            </span>
          ) : null}
        </div>
      </Card>

      <div className="visit-steps">
        {steps.map((step) => (
          <Link key={step.to} to={step.to} className="visit-step">
            <div>
              <p className="visit-step__title">{step.title}</p>
              <p className="visit-step__hint">{step.hint}</p>
            </div>
            <span aria-hidden>→</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
