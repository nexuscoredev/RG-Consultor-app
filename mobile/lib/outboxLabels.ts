const LABELS: Record<string, string> = {
  CHECK_IN: 'Check-in',
  CHECK_OUT: 'Check-out',
  MEETING_LOG: 'Registo de reunião',
  PROPOSAL_SENT: 'Proposta enviada',
  CONTRACT_CLOSED: 'Contrato fechado',
  PROSPECTING_SAVED: 'Prospecção',
  PROPOSAL_ACCEPTED: 'Proposta aceite',
  CLIENT_SAVED: 'Cliente salvo',
  FOLLOW_UP_SENT: 'Follow-up',
};

export function outboxTypeLabel(type: string): string {
  return LABELS[type] ?? type;
}

export function outboxPayloadSummary(type: string, payloadJson: string): string {
  try {
    const p = JSON.parse(payloadJson) as Record<string, string>;
    if (p.company) return p.company;
    if (p.client) return p.client;
    if (p.paradaId) return `Parada ${p.paradaId.slice(0, 8)}…`;
  } catch {
    /* ignore */
  }
  return '—';
}
