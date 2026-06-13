import { afterCommercialEnqueue } from '@/lib/commercialSync';
import { recordPipelineStep } from '@/lib/gamificationEngine';
import { syncMeetingLogToPipeline } from '@/lib/localPipelineStore';
import { enqueueMeetingLog } from '@/lib/outbox';
import { setNextStep } from '@/lib/visitStore';

export type VisitOutcomeKind = 'proposta' | 'mtr' | 'coleta' | 'outro';

const OUTCOME_META: Record<VisitOutcomeKind, { step: string; note: string; pipelineAction: string }> = {
  proposta: { step: 'proposta', note: 'Proposta enviada ao cliente', pipelineAction: 'Enviar proposta formal / follow-up' },
  mtr: { step: 'mtr', note: 'Aguardando MTR / documentação', pipelineAction: 'Regularizar MTR e documentação' },
  coleta: { step: 'coleta', note: 'Coleta agendada', pipelineAction: 'Confirmar coleta / contrato' },
  outro: { step: 'outro', note: 'Registrado em campo', pipelineAction: 'Acompanhar próximo passo combinado' },
};

function newId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
}

export type VisitOutcomeContext = {
  routeDate: string;
  stopId: string;
  company: string;
  contact?: string;
  address?: string;
  city?: string;
  phone?: string;
};

export async function registerVisitOutcome(
  kind: VisitOutcomeKind,
  ctx: VisitOutcomeContext,
  sync?: { runSyncNow: () => Promise<void>; refreshCounts: () => void },
): Promise<void> {
  const meta = OUTCOME_META[kind];
  setNextStep(ctx.routeDate, ctx.stopId, meta.step, meta.note);

  const logId = newId();
  await syncMeetingLogToPipeline({
    id: logId,
    client: ctx.company,
    notes: meta.note,
    nextAction: meta.pipelineAction,
    nextDate: '',
    visit: {
      routeDate: ctx.routeDate,
      stopId: ctx.stopId,
      contact: ctx.contact,
      address: ctx.address,
      city: ctx.city,
      phone: ctx.phone,
    },
  });

  enqueueMeetingLog({
    client: ctx.company,
    notes: meta.note,
    nextAction: meta.pipelineAction,
    nextDate: '',
  });

  if (kind === 'proposta') recordPipelineStep('proposta');
  else if (kind === 'mtr') recordPipelineStep('mtr');
  else if (kind === 'coleta') recordPipelineStep('coleta');
  else recordPipelineStep('outro');

  if (sync) afterCommercialEnqueue(sync);
}
