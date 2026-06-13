export type CommercialPhase = 'prospecting' | 'proposal' | 'acceptance' | 'contract';

export const COMMERCIAL_PHASE_ORDER: CommercialPhase[] = [
  'prospecting',
  'proposal',
  'acceptance',
  'contract',
];

export function inferPhaseFromStage(stage: string): CommercialPhase {
  const s = stage.toLowerCase();
  if (/contrato/i.test(s)) return 'contract';
  if (/aceite|aceita|intenção|intencao/i.test(s)) return 'acceptance';
  if (/proposta/i.test(s)) return 'proposal';
  return 'prospecting';
}

export function phaseLabel(phase: CommercialPhase): string {
  switch (phase) {
    case 'prospecting':
      return '1 · Prospecção';
    case 'proposal':
      return '2 · Proposta';
    case 'acceptance':
      return '3 · Aceite';
    case 'contract':
      return '4 · Contrato';
  }
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

export type FunnelTool = {
  path: string;
  label: string;
};

export type FunnelPhaseConfig = {
  phase: CommercialPhase;
  title: string;
  subtitle: string;
  primaryPath: string;
  primaryLabel: string;
  tools: FunnelTool[];
};

export const FUNNEL_HUB: FunnelPhaseConfig[] = [
  {
    phase: 'prospecting',
    title: 'Prospecção',
    subtitle: 'Qualificar o cliente e recolher informação de diagnóstico',
    primaryPath: '/comercial/prospecao',
    primaryLabel: 'Formulário de prospecção',
    tools: [
      { path: '/comercial/prospecao', label: 'Formulário de prospecção' },
      { path: '/comercial/roteiro-visita', label: 'Roteiro de visita' },
      { path: '/comercial/pitch-faq', label: 'Pitch e objeções' },
      { path: '/comercial/checklist-docs', label: 'Checklist documental' },
      { path: '/comercial/cases', label: 'Cases por segmento' },
      { path: '/comercial/comparativo', label: 'RG vs sem RG' },
      { path: '/comercial/registro-reuniao', label: 'Registo de reunião' },
    ],
  },
  {
    phase: 'proposal',
    title: 'Proposta',
    subtitle: 'Gerar proposta e acompanhar follow-up',
    primaryPath: '/comercial/proposta',
    primaryLabel: 'Gerar proposta PDF',
    tools: [
      { path: '/comercial/proposta', label: 'Gerar proposta PDF' },
      { path: '/comercial/calculadora', label: 'Calculadora comercial' },
      { path: '/comercial/followup', label: 'Follow-up proposta' },
    ],
  },
  {
    phase: 'acceptance',
    title: 'Aceite',
    subtitle: 'Registar aceite e termo de intenção',
    primaryPath: '/comercial/aceite',
    primaryLabel: 'Registo de aceite',
    tools: [
      { path: '/comercial/aceite', label: 'Registo de aceite' },
      { path: '/comercial/termo-intencao', label: 'Termo de intenção' },
      { path: '/comercial/followup', label: 'Follow-up aceite' },
    ],
  },
  {
    phase: 'contract',
    title: 'Contrato',
    subtitle: 'Formalizar contrato e onboarding',
    primaryPath: '/comercial/contrato',
    primaryLabel: 'Fluxo de contrato',
    tools: [
      { path: '/comercial/contrato', label: 'Fluxo de contrato' },
      { path: '/comercial/kit-contrato', label: 'Kit contrato' },
      { path: '/comercial/checklist-docs', label: 'Docs de onboarding' },
    ],
  },
];

export function getPhaseConfig(phase: CommercialPhase): FunnelPhaseConfig {
  return FUNNEL_HUB.find((p) => p.phase === phase) ?? FUNNEL_HUB[0];
}
