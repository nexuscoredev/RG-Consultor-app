/** Conteúdo do kit comercial (pt-BR) — textos longos fora do i18n para manutenção. */

export const VISIT_PLAYBOOK = [
  {
    title: '1. Abrir a conversa',
    bullets: [
      'Cumprimente e confirme o tempo combinado (ex.: 30–45 min).',
      'Pergunte o que o cliente espera tirar da reunião e anote.',
      'Evite monólogo nos primeiros 5 minutos.',
    ],
  },
  {
    title: '2. Diagnóstico de resíduos',
    bullets: [
      'Tipos de resíduo (classe), volumes mensais, armazenamento atual.',
      'MTR, destinação e licenças: o que já existe e onde dói.',
      'Multas, auditorias ou reclamações recentes (gatilho de urgência).',
    ],
  },
  {
    title: '3. Encaixe RG',
    bullets: [
      'Conecte cada dor a um serviço RG (coleta, MTR, consultoria, treino).',
      'Use linguagem simples; evite siglas sem explicar.',
      'Mostre trilha documental ou case do mesmo segmento, se couber.',
    ],
  },
  {
    title: '4. Próximos passos',
    bullets: [
      'Proposta ou visita técnica? Prazo para resposta do cliente.',
      'Quem mais entra na decisão (EHS, compras, diretoria)?',
      'Defina o que você envia até quando (PDF, planilha, amostra).',
    ],
  },
  {
    title: '5. Data de retorno',
    bullets: [
      'Marque na hora a próxima call ou visita (evite “depois eu te chamo”).',
      'Registe no app (Registo de reunião) e no pipeline.',
      'Agradeça e confirme canal (WhatsApp, e-mail) para o follow-up.',
    ],
  },
] as const;

export const PITCH_60S = `Em 1 frase: a RG Ambiental cuida do ciclo dos seus resíduos com rastreabilidade e conformidade legal.

Em 30 segundos: coletamos, transportamos e destinamos com MTR e documentação auditável — menos risco de multa e menos tempo da sua equipe com burocracia.

Em 60 segundos: além da operação, apoiamos licenças, treinamentos e melhoria contínua — você ganha previsibilidade de custo e tranquilidade em fiscalização.

Pergunta de fecho: “Faz sentido avançarmos com uma proposta alinhada ao volume que vocês comentaram?”`;

export const FAQ_ITEMS = [
  {
    q: 'Está caro em relação ao concorrente X',
    a: 'Compare escopo item a item (MTR, rastreio, PGRS, SLA de coleta). Muitas vezes o menor preço omite custo de retrabalho ou multa. Podemos montar um comparativo transparente.',
  },
  {
    q: 'Não temos urgência com MTR',
    a: 'Sem MTR válido a responsabilidade é solidária na cadeia. Mesmo sem fiscalização imediata, o risco em auditoria ou acidente é alto. Proponha um piloto em uma unidade.',
  },
  {
    q: 'Auditoria está longe',
    a: 'Auditorias surpresa e denúncias anônimas acontecem. Ter histórico digital pronto reduz estresse e tempo parado na fábrica.',
  },
  {
    q: 'Multas são raras no nosso segmento',
    a: 'Multa é só o topo do iceberg — retrabalho, parada de linha e imagem custam mais. Use um número conservador de horas internas gastas com resíduo.',
  },
] as const;

export const CALC_CATEGORIES = [
  { id: 'industria', label: 'Indústria (classe I / II)', baseMin: 2800, baseMax: 8500, perTon: 450 },
  { id: 'saude', label: 'Saúde / laboratório', baseMin: 4200, baseMax: 12000, perTon: 620 },
  { id: 'logistica', label: 'Logística / galpão', baseMin: 1800, baseMax: 5500, perTon: 320 },
  { id: 'comercio', label: 'Comércio / escritórios', baseMin: 900, baseMax: 3200, perTon: 180 },
] as const;

export type CalcCategoryId = (typeof CALC_CATEGORIES)[number]['id'];

export function estimateRange(categoryId: CalcCategoryId, tonsPerMonth: number): { min: number; max: number } {
  const c = CALC_CATEGORIES.find((x) => x.id === categoryId) ?? CALC_CATEGORIES[0];
  const t = Math.max(0, Math.min(500, tonsPerMonth));
  const min = Math.round(c.baseMin + t * c.perTon * 0.85);
  const max = Math.round(c.baseMax + t * c.perTon * 1.15);
  return { min, max };
}

export const CALC_DISCLAIMER =
  'Valores meramente indicativos para conversa comercial — não constituem proposta. Contrato formal, visita técnica e análise de escopo definem preço.';

export const CASES = [
  {
    id: 'ind',
    segment: 'Indústria',
    title: 'Menos paradas para burocracia de resíduo',
    before: 'Planilhas paralelas e MTR inconsistente em auditoria.',
    after: 'Um fluxo único com rastreabilidade e SLA de coleta.',
  },
  {
    id: 'sau',
    segment: 'Saúde',
    title: 'Rastreio para resíduos infectantes e laboratoriais',
    before: 'Equipe clínica perdia tempo segregando e etiquetando sem padrão.',
    after: 'Protocolo visual + coleta confiável com documentação pronta.',
  },
  {
    id: 'log',
    segment: 'Logística',
    title: 'Galpões com múltiplos geradores',
    before: 'Fornecedores diferentes por filial geravam conflito de dados.',
    after: 'Consolidação operacional e relatório único para matriz.',
  },
] as const;

export const COMPARE_ROWS = [
  { aspect: 'Risco legal / multas', sem: 'Alto — lacunas em MTR e cadeia', com: 'Reduzido — trilha e responsáveis claros' },
  { aspect: 'Tempo interno', sem: 'Horas/semana com planilhas e correções', com: 'Menos retrabalho; foco no core do negócio' },
  { aspect: 'Rastreabilidade', sem: 'Fragmentada entre fornecedores', com: 'Histórico auditável e padronizado' },
  { aspect: 'Imagem com cliente final', sem: 'Difícil provar conformidade', com: 'Evidências e certificados organizados' },
  { aspect: 'Previsibilidade de custo', sem: 'Custo oculto (multa, parada)', com: 'Contrato e SLA com transparência' },
] as const;

export const DOCS_CHECKLIST = [
  { id: 'mtr', label: 'MTRs recentes (últimos 12–24 meses)' },
  { id: 'lic', label: 'Licenças ambientais vigentes' },
  { id: 'pgrs', label: 'PGRS / PGRSS atualizado' },
  { id: 'contr', label: 'Contratos com transportadores / destinação' },
  { id: 'cd', label: 'Certificados de destinação / CD' },
  { id: 'trei', label: 'Registros de treinamento interno (NRs aplicáveis)' },
  { id: 'insp', label: 'Relatórios de inspeção ou autuações (se houver)' },
] as const;

export const FOLLOWUP_EMAIL = `Assunto: RG Ambiental — próximos passos após nossa conversa

Olá, {NOME},

Obrigado pelo tempo hoje. Segue o resumo do que alinhamos:
• Escopo discutido: {ESCOPO}
• Próximo passo: {PASSO}
• Prazo combinado: {PRAZO}

Em anexo / link: proposta comercial RG (PDF).

Fico à disposição para ajustar o escopo ou incluir a equipe técnica.

Abraço,
{CONSULTOR}
RG Ambiental`;

export const FOLLOWUP_WHATSAPP = `Olá {NOME}! Obrigado pela conversa de hoje na {EMPRESA}.

Resumo: {ESCOPO}
Próximo passo: {PASSO} até {PRAZO}.

Envio a proposta em PDF por aqui / e-mail. Alguma dúvida que eu já esclareça?`;

export const INTENT_TERM_POINTS = [
  'Documento *não* substitui contrato assinado — serve como registro de intenção de negócio e alinhamento de escopo.',
  'Inclua: partes, objeto resumido, vigência da intenção, confidencialidade básica e foro.',
  'Sempre valide modelo com jurídico antes de padronizar no app.',
  'Use o assistente “Novo contrato” para capturar dados e depois anexar o PDF assinado no CRM.',
] as const;

export const PROSPECTING_SOURCES = [
  'Rota / agenda',
  'Indicação',
  'Prospecção ativa (cold)',
  'Evento / feira',
  'Inbound (site / telefone)',
] as const;

export const ACCEPTANCE_TYPES = [
  { id: 'verbal', label: 'Aceite verbal (registado em reunião)' },
  { id: 'email', label: 'Resposta por e-mail' },
  { id: 'signed_pdf', label: 'Proposta assinada (PDF)' },
  { id: 'intent_term', label: 'Termo de intenção assinado' },
] as const;

export const ACCEPTANCE_DOC_CHECKLIST = [
  { id: 'proposal_pdf', label: 'Proposta comercial assinada ou e-mail de aceite' },
  { id: 'cnpj_card', label: 'Cartão CNPJ / contrato social' },
  { id: 'licenses', label: 'Licenças ambientais vigentes' },
  { id: 'waste_map', label: 'Mapa de resíduos / volumes' },
  { id: 'billing', label: 'Dados de faturamento (NF, e-mail financeiro)' },
  { id: 'po', label: 'Pedido de compra (se exigido)' },
] as const;

export const ACCEPTANCE_EMAIL = `Assunto: RG Ambiental — confirmação de aceite da proposta {PROPOSTA}

Olá, {NOME},

Confirmamos o recebimento do aceite da proposta comercial RG para {EMPRESA}.

• Escopo aceite: {ESCOPO}
• Investimento acordado: {VALOR}
• Próximo passo: formalização do contrato e coleta de documentação ({PRAZO})

Anexos a enviar (se ainda não recebidos):
{DOC_LIST}

Qualquer ajuste, responda neste e-mail ou pelo WhatsApp.

Atenciosamente,
{CONSULTOR}
RG Ambiental`;

export const ACCEPTANCE_WHATSAPP = `Olá {NOME}! Confirmamos o aceite da proposta {PROPOSTA} para {EMPRESA}.

Escopo: {ESCOPO}
Valor: {VALOR}

Próximo passo: contrato formal + documentos até {PRAZO}.

Pode enviar por aqui: {DOC_LIST}`;

export const CONTRACT_KIT_SECTIONS = [
  {
    title: '1. Identificação das partes',
    bullets: [
      'Razão social, CNPJ, endereço e representante legal do cliente.',
      'RG Ambiental: CNPJ, endereço e signatário autorizado.',
    ],
  },
  {
    title: '2. Objeto e escopo',
    bullets: [
      'Tipos de resíduo (classe), volumes estimados, frequência de coleta.',
      'Serviços inclusos: MTR, transporte, destinação, consultoria, treinamentos.',
      'Exclusões explícitas (evita disputa depois).',
    ],
  },
  {
    title: '3. Preço e reajuste',
    bullets: [
      'Valor mensal ou por tonelada; mínimo faturável.',
      'Índice de reajuste (IPCA/IGP-M) e periodicidade.',
      'Custos extras: urgência, hora parada, destinação especial.',
    ],
  },
  {
    title: '4. SLA e operação',
    bullets: [
      'Janelas de coleta, tempo de resposta a chamados.',
      'Substituição de equipamentos (containers, acondicionamento).',
      'Canal único de atendimento e escalation.',
    ],
  },
  {
    title: '5. Conformidade e documentação',
    bullets: [
      'Responsabilidade solidária na cadeia — papel de cada parte.',
      'Entrega de MTR, CDs e relatórios; prazos de arquivo.',
      'Auditorias e acesso à planta.',
    ],
  },
  {
    title: '6. Vigência e rescisão',
    bullets: [
      'Prazo inicial, renovação automática, aviso prévio.',
      'Multas e devolução de equipamentos.',
      'Foro e mediação.',
    ],
  },
] as const;

export const CONTRACT_PRE_SIGN_CHECKLIST = [
  'Proposta aceita arquivada (PDF ou e-mail)',
  'CNPJ e IE conferidos com cartão CNPJ',
  'Escopo técnico validado por operações',
  'Tabela de preço aprovada pelo comercial',
  'Cláusulas especiais revisadas pelo jurídico',
  'Assinatura digital ou física com duas testemunhas (se aplicável)',
  'Cadastro no ERP / CRM e data de início da coleta',
] as const;
