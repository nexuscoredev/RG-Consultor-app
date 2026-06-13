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
] as const;

export const FAQ_ITEMS = [
  {
    q: 'Está caro em relação ao concorrente X',
    a: 'Compare escopo item a item (MTR, rastreio, PGRS, SLA de coleta). Muitas vezes o menor preço omite custo de retrabalho ou multa.',
  },
  {
    q: 'Não temos urgência com MTR',
    a: 'Sem MTR válido a responsabilidade é solidária na cadeia. Proponha um piloto em uma unidade.',
  },
  {
    q: 'Auditoria está longe',
    a: 'Auditorias surpresa acontecem. Ter histórico digital pronto reduz estresse e tempo parado na fábrica.',
  },
] as const;

export const CALC_CATEGORIES = [
  { id: 'industria', label: 'Indústria (classe I / II)', baseMin: 2800, baseMax: 8500, perTon: 450 },
  { id: 'saude', label: 'Saúde / laboratório', baseMin: 4200, baseMax: 12000, perTon: 620 },
  { id: 'logistica', label: 'Logística / galpão', baseMin: 1800, baseMax: 5500, perTon: 320 },
  { id: 'comercio', label: 'Comércio / escritórios', baseMin: 900, baseMax: 3200, perTon: 180 },
] as const;

export const DOCS_CHECKLIST = [
  { id: 'mtr', label: 'MTRs recentes (últimos 12–24 meses)' },
  { id: 'lic', label: 'Licenças ambientais vigentes' },
  { id: 'pgrs', label: 'PGRS / PGRSS atualizado' },
  { id: 'contr', label: 'Contratos com transportadores / destinação' },
  { id: 'cd', label: 'Certificados de destinação / CD' },
  { id: 'trei', label: 'Registros de treinamento interno' },
  { id: 'insp', label: 'Relatórios de inspeção ou autuações' },
] as const;

export const PROSPECTING_SOURCES = [
  'Rota / agenda',
  'Indicação',
  'Prospecção ativa (cold)',
  'Evento / feira',
  'Inbound (site / telefone)',
] as const;

export const ACCEPTANCE_TYPES = [
  'E-mail formal',
  'Reunião presencial',
  'WhatsApp com confirmação',
  'Termo de intenção assinado',
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

export const DOCS_CHECKLIST_LEGACY = [
  'Licença de operação / alvará',
  'MTR dos últimos 12 meses',
  'Contratos com transportadores e destinadores',
  'PGRS ou plano de resíduos vigente',
  'Fotos da área de armazenamento',
  'Contato EHS / compras com e-mail e telefone',
] as const;

export type ToolContent = {
  title: string;
  intro: string;
  sections?: { title: string; bullets?: string[]; body?: string }[];
  list?: readonly string[];
  faq?: readonly { q: string; a: string }[];
};

export const TOOL_CONTENT: Record<string, ToolContent> = {
  prospecao: {
    title: 'Formulário de prospecção',
    intro: 'Registe o diagnóstico inicial do cliente. Os dados alimentam o pipeline.',
    sections: [
      {
        title: 'Campos essenciais',
        bullets: [
          'Razão social e CNPJ',
          'Segmento e volume estimado (t/mês)',
          'Tipos de resíduo e classe',
          'Dores principais (multa, MTR, custo, imagem)',
          'Decisor e prazo de decisão',
        ],
      },
    ],
  },
  'roteiro-visita': {
    title: 'Roteiro de visita',
    intro: 'Use este roteiro na reunião presencial ou remota.',
    sections: VISIT_PLAYBOOK.map((s) => ({ title: s.title, bullets: [...s.bullets] })),
  },
  'pitch-faq': {
    title: 'Pitch e objeções',
    intro: 'Pitch de 60 segundos e respostas para objeções frequentes.',
    sections: [
      {
        title: 'Pitch 60s',
        body: 'A RG Ambiental cuida do ciclo dos seus resíduos com rastreabilidade e conformidade legal — coleta, MTR e documentação auditável, com menos risco de multa e menos tempo da equipe com burocracia.',
      },
    ],
    faq: FAQ_ITEMS,
  },
  'checklist-docs': {
    title: 'Checklist documental',
    intro: 'Documentos para pedir na prospecção ou onboarding.',
    list: DOCS_CHECKLIST_LEGACY,
  },
  cases: {
    title: 'Cases por segmento',
    intro: 'Exemplos de valor por segmento para usar na conversa.',
    sections: [
      { title: 'Indústria', body: 'Redução de 40% em horas internas com MTR digital e coleta programada.' },
      { title: 'Saúde', body: 'Rastreio classe A com auditoria pronta em 48h.' },
      { title: 'Logística', body: 'Consolidação de fornecedores e previsibilidade de custo mensal.' },
    ],
  },
  comparativo: {
    title: 'RG vs sem RG',
    intro: 'Compare de forma transparente com o cliente.',
    sections: [
      {
        title: 'Com RG',
        bullets: ['MTR e rastreio', 'SLA de coleta', 'Suporte EHS', 'Histórico auditável'],
      },
      {
        title: 'Sem RG / informal',
        bullets: ['Risco solidário', 'Retrabalho interno', 'Multas e paradas', 'Sem previsibilidade'],
      },
    ],
  },
  'registro-reuniao': {
    title: 'Registo de reunião',
    intro: 'Após cada reunião, registe decisões e próximos passos no pipeline.',
    sections: [
      {
        title: 'O que anotar',
        bullets: [
          'Participantes e cargo',
          'Dores confirmadas',
          'Próxima ação e data',
          'Materiais a enviar',
        ],
      },
    ],
  },
  followup: {
    title: 'Follow-up',
    intro: 'Modelo de mensagem para WhatsApp ou e-mail após proposta ou aceite.',
    sections: [
      {
        title: 'Proposta',
        body: 'Olá [nome], segue a proposta RG para [empresa] conforme conversamos. Posso esclarecer algum ponto até [data]?',
      },
      {
        title: 'Aceite',
        body: 'Obrigado pelo retorno positivo! Vamos avançar com o termo de intenção e documentação para contrato.',
      },
    ],
  },
  aceite: {
    title: 'Registo de aceite',
    intro: 'Registe quando o cliente aceita a proposta verbalmente ou por e-mail.',
    sections: [
      {
        title: 'Dados',
        bullets: ['Empresa', 'Nº proposta', 'Valor acordado', 'Data do aceite', 'Canal (e-mail, reunião)'],
      },
    ],
  },
  'termo-intencao': {
    title: 'Termo de intenção',
    intro: 'Gere o termo na tela de proposta/contrato e use Imprimir → PDF no browser.',
    sections: [{ title: 'Uso', body: 'Preencha empresa, escopo e validade. Exporte via impressão do navegador.' }],
  },
  contrato: {
    title: 'Fluxo de contrato',
    intro: 'Passo a passo: cliente → serviço → valores → envio.',
    sections: [
      { title: '1. Cliente', bullets: ['Razão social', 'CNPJ'] },
      { title: '2. Serviço', bullets: ['Tipo de resíduo', 'Volume', 'Frequência'] },
      { title: '3. Comercial', bullets: ['Valor mensal', 'Prazo', 'Índice de reajuste'] },
    ],
  },
  'kit-contrato': {
    title: 'Kit contrato',
    intro: 'Modelos e anexos padrão RG para formalização.',
    list: ['Minuta de contrato', 'Anexo técnico', 'Tabela de preços', 'SLA de coleta'],
  },
  calculadora: {
    title: 'Calculadora comercial',
    intro: 'Estimativa rápida para apoiar a proposta (valores de referência).',
    sections: CALC_CATEGORIES.map((c) => ({
      title: c.label,
      body: `Base: R$ ${c.baseMin.toLocaleString('pt-BR')} – ${c.baseMax.toLocaleString('pt-BR')}/mês · ~R$ ${c.perTon}/ton`,
    })),
  },
};
