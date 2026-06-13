import type { Href } from 'expo-router';

import type { HubIconName } from '@/components/ui/HubListRow';

/** Fases do ciclo comercial do consultor. */
export type CommercialPhase = 'prospecting' | 'proposal' | 'acceptance' | 'contract';

export const COMMERCIAL_PHASE_ORDER: CommercialPhase[] = [
  'prospecting',
  'proposal',
  'acceptance',
  'contract',
];

/** Estágios canónicos no pipeline (pt-BR). */
export const FUNNEL_STAGE = {
  prospecting: 'Prospecção',
  prospectingDocs: 'Diagnóstico / documentação',
  visitLogged: 'Registo de visita',
  proposalFollowup: 'Proposta — follow-up',
  proposalSent: 'Proposta enviada',
  accepted: 'Proposta aceita',
  acceptanceDocs: 'Aceite — docs pendentes',
  contractClosed: 'Contrato fechado',
  contractActive: 'Contrato ativo',
} as const;

export function inferPhaseFromStage(stage: string): CommercialPhase {
  const s = stage.toLowerCase();
  if (/contrato/i.test(s)) return 'contract';
  if (/aceite|aceita|intenção|intencao/i.test(s)) return 'acceptance';
  if (/proposta/i.test(s)) return 'proposal';
  return 'prospecting';
}

export type FunnelHubTool = {
  href: Href;
  icon: HubIconName;
  /** Chave em i18n `commercial.funnelTools` */
  toolKey: string;
};

export type FunnelPhaseConfig = {
  phase: CommercialPhase;
  /** Chave em i18n `commercial.funnelPhases` */
  phaseKey: string;
  primaryHref?: Href;
  primaryToolKey?: string;
  tools: FunnelHubTool[];
};

export function getPhaseConfig(phase: CommercialPhase): FunnelPhaseConfig | undefined {
  return FUNNEL_HUB.find((p) => p.phase === phase);
}

export function primaryHrefForPhase(phase: CommercialPhase): Href {
  return getPhaseConfig(phase)?.primaryHref ?? '/(tabs)/commercial';
}

export function nextPhase(phase: CommercialPhase): CommercialPhase | null {
  const idx = COMMERCIAL_PHASE_ORDER.indexOf(phase);
  if (idx < 0 || idx >= COMMERCIAL_PHASE_ORDER.length - 1) return null;
  return COMMERCIAL_PHASE_ORDER[idx + 1];
}

export function phaseShortLabel(phase: CommercialPhase): string {
  switch (phase) {
    case 'prospecting':
      return 'Prospecção';
    case 'proposal':
      return 'Proposta';
    case 'acceptance':
      return 'Aceite';
    case 'contract':
      return 'Contrato';
  }
}

export const FUNNEL_HUB: FunnelPhaseConfig[] = [
  {
    phase: 'prospecting',
    phaseKey: 'prospecting',
    primaryHref: '/(tabs)/commercial/prospecting',
    primaryToolKey: 'prospectingForm',
    tools: [
      { href: '/(tabs)/commercial/prospecting', icon: 'clipboard-text-outline', toolKey: 'prospectingForm' },
      { href: '/(tabs)/commercial/visit-playbook', icon: 'format-list-numbered', toolKey: 'visitPlaybook' },
      { href: '/(tabs)/commercial/pitch-faq', icon: 'bullhorn', toolKey: 'pitchFaq' },
      { href: '/(tabs)/commercial/docs-checklist', icon: 'checkbox-marked-outline', toolKey: 'docsChecklist' },
      { href: '/(tabs)/commercial/cases', icon: 'briefcase-outline', toolKey: 'cases' },
      { href: '/(tabs)/commercial/compare', icon: 'scale-balance', toolKey: 'compare' },
      { href: '/(tabs)/commercial/meeting-log', icon: 'notebook-edit-outline', toolKey: 'meetingLog' },
    ],
  },
  {
    phase: 'proposal',
    phaseKey: 'proposal',
    primaryHref: '/(tabs)/commercial/proposal',
    primaryToolKey: 'proposalPdf',
    tools: [
      { href: '/(tabs)/commercial/proposal', icon: 'file-pdf-box', toolKey: 'proposalPdf' },
      { href: '/(tabs)/commercial/calculator', icon: 'calculator-variant', toolKey: 'calculator' },
      { href: '/(tabs)/commercial/followup', icon: 'email-outline', toolKey: 'followupProposal' },
    ],
  },
  {
    phase: 'acceptance',
    phaseKey: 'acceptance',
    primaryHref: '/(tabs)/commercial/acceptance',
    primaryToolKey: 'acceptanceForm',
    tools: [
      { href: '/(tabs)/commercial/acceptance', icon: 'handshake-outline', toolKey: 'acceptanceForm' },
      { href: '/(tabs)/commercial/intent-term', icon: 'file-sign', toolKey: 'intentTerm' },
      { href: '/(tabs)/commercial/followup', icon: 'send-outline', toolKey: 'followupAcceptance' },
    ],
  },
  {
    phase: 'contract',
    phaseKey: 'contract',
    primaryHref: '/(tabs)/commercial/contract-flow',
    primaryToolKey: 'contractFlow',
    tools: [
      { href: '/(tabs)/commercial/contract-flow', icon: 'file-document-edit-outline', toolKey: 'contractFlow' },
      { href: '/(tabs)/commercial/contract-kit', icon: 'file-certificate-outline', toolKey: 'contractKit' },
      { href: '/(tabs)/commercial/docs-checklist', icon: 'folder-check-outline', toolKey: 'docsOnboarding' },
    ],
  },
];
