/** i18n leve (pt-BR). Expandir chaves conforme telas forem migradas. */
const pt = {
  common: {
    retry: 'Tentar novamente',
    ok: 'OK',
    cancel: 'Cancelar',
    linkOpenFailed: 'Não foi possível abrir o link. Tente de novo ou copie o endereço.',
  },
  error: {
    title: 'Algo saiu do esperado',
    body: 'O app encontrou um erro. Pode tentar de novo ou voltar mais tarde.',
  },
  more: {
    title: 'Mais',
    subtitle: 'Ferramentas e conformidade',
  },
  master: {
    brand: 'RG Consultor',
    title: 'Painel master',
    subtitleDemo: 'visão consolidada (dados de demonstração)',
    signOut: 'Sair',
    kpiVisits: 'Visitas / semana',
    kpiContracts: 'Contratos / mês',
    kpiAvgXp: 'XP médio',
    heatTitle: 'Mapa de calor (cobertura simulada)',
    heatHint: 'Intensidade = visitas + contratos por região (dados demo). Integração futura: heatmap real no mapa.',
  },
  consent: {
    title: 'Consentimento LGPD',
    step: 'Passo',
    of: 'de',
    locUseTitle: 'Localização em uso',
    locUseBody:
      'Usamos GPS para validar check-in/check-out no cliente e oferecer rotas. Obrigatório para o modo normal do app.',
    locUseToggle: 'Aceito uso quando o app está aberto',
    locBgTitle: 'Localização em segundo plano',
    locBgBody:
      'Opcional: permite rastreamento operacional para a diretoria durante a jornada. Pode ser alterado depois nas configurações do sistema.',
    locBgToggle: 'Aceito coleta em background (opcional)',
    retentionTitle: 'Retenção de dados',
    retentionBody:
      'Dados de visita e telemetria seguem política interna de retenção (ex.: 24 meses) e acesso por perfil. Você pode solicitar cópia ou correção conforme LGPD.',
    retentionToggle: 'Li e aceito a política de retenção resumida',
    back: 'Voltar',
    continue: 'Continuar',
    finish: 'Concluir',
  },
  login: {
    title: 'Entrar',
    demoHint:
      'Login de demonstração — e-mail e senha não vazios. Use e-mail que comece com master@ ou admin@ para o painel master.',
    email: 'E-mail',
    password: 'Senha',
    submit: 'Entrar',
    demoBadge: 'Modo demonstração',
  },
  settings: {
    theme: 'Aparência',
    themeLight: 'Claro',
    themeDark: 'Escuro',
    themeSystem: 'Sistema',
    biometricTest: 'Testar biometria',
    biometricHint: 'Face ID / impressão digital (se disponível no aparelho).',
    nativeVsOtaTitle: 'Atualizações na loja e OTA',
    nativeVsOtaBody:
      'Atualizações pelo ar (OTA) trazem telas e lógica em JavaScript. Novas permissões, chaves nativas (ex.: Google Maps) ou bibliotecas nativas exigem nova versão na Play Store ou novo APK.',
    account: 'Conta',
    profileMaster: 'Master / ADM',
    profileSeller: 'Consultor comercial',
    biometricPref: 'Lembrete biométrico (preferência)',
    syncTitle: 'Sincronização',
    syncQueue: 'Fila: {pending} pendente(s), {failed} falha(s). Estado: {status}.',
    syncNow: 'Sincronizar agora',
    syncNowA11y: 'Sincronizar agora',
    retryFailed: 'Repetir falhas',
    rankingTitle: 'Ranking (opt-in)',
    rankingToggle: 'Participar do ranking semanal',
    rankingAliasLabel: 'Pseudônimo no painel',
    aliasPlaceholder: 'Nome exibido',
    signOut: 'Sair',
    signOutA11y: 'Sair',
    noHardware: 'Este aparelho não expõe hardware biométrico.',
    noEnrolled: 'Nenhuma biometria cadastrada no sistema.',
    bioSuccess: 'Autenticação bem-sucedida.',
    bioCancelled: 'Cancelado ou falhou.',
    bioTitle: 'Biometria',
    otaCheckSection: 'Atualização (OTA)',
    otaCheckHint:
      'Busca uma versão nova publicada na Expo. Funciona no app instalado pelo EAS ou loja — não no Expo Go nem em modo desenvolvimento.',
    otaCheckBtn: 'Buscar atualização agora',
    otaCheckDev: 'OTA não está ativa neste modo (desenvolvimento ou Expo Go). Use o APK/TestFlight para testar.',
    otaCheckSearching: 'Procurando atualização…',
    otaCheckUpToDate: 'Você já está na última versão publicada para esta instalação.',
    otaCheckFoundTitle: 'Nova versão disponível',
    otaCheckFoundBody: 'Baixar e reiniciar o app agora?',
    otaCheckFoundLater: 'Depois',
    otaCheckFoundApply: 'Atualizar agora',
    otaCheckFail: 'Não foi possível verificar ou baixar. Confira a rede e tente de novo.',
  },
  sync: {
    title: 'Sincronização',
    offline: 'Sem rede — alterações ficam na fila até reconectar.',
    pending: 'Pendentes',
    failed: 'Falhas',
    syncBtn: 'Sincronizar',
    retryBtn: 'Repetir',
  },
  pipeline: {
    empty: 'Nenhuma oportunidade na lista. Puxe para atualizar ou verifique a conexão.',
  },
  home: {
    pullTipTitle: 'Dica',
    pullTipBody: 'Puxe a tela para baixo na Início para atualizar rota e visitas.',
    pullTipDismiss: 'Entendi',
    emptySubtitle: 'Carregue uma rota para começar.',
    emptyNoStops: 'Nenhuma parada na agenda de hoje.',
    footerOutbox: 'Fila outbox: {pending} pendente(s) · {failed} falha(s)',
    nextAddress: 'Próximo endereço',
    openAgenda: 'Abrir agenda',
    openAgendaA11y: 'Abrir agenda na parada',
    currentMission: 'Missão atual',
    missionProgress: '{current} / {target} concluído',
    viewMissions: 'Ver missões',
    openMissionCenterA11y: 'Abrir mission center',
    xp: 'XP',
    coins: 'Moedas',
    goStore: 'Ir à loja',
    openStoreA11y: 'Abrir loja de prêmios',
    shortcuts: 'Atalhos',
    agenda: 'Agenda',
    missions: 'Missões',
    showroom: 'Showroom',
    openAgendaA11y2: 'Abrir agenda',
    openMissionsA11y: 'Abrir missões',
    openVideosA11y: 'Abrir vídeos',
    management: 'Gestão',
    atClientTitle: 'Você está no cliente',
    atClientBody: 'Check-in GPS em destaque na visita abaixo.',
    nextVisit: 'Próxima visita',
    operationCta: 'Nossa Operação — vitrine completa',
    openShowroomA11y: 'Abrir showroom Nossa Operação',
  },
  documents: {
    intro:
      'Trilha resumida para o vendedor: do resíduo gerado ao certificado. Substitua URLs por endpoints autenticados do backend.',
    items: [
      {
        title: 'Portal MTR (exemplo)',
        url: 'https://www.rgambiental.com.br/',
        hint: 'Abre site institucional — substituir por integração real',
      },
      {
        title: 'Certificado de destinação (modelo)',
        url: 'https://www.rgambiental.com.br/',
        hint: 'Link seguro assinado viria da API',
      },
      {
        title: 'Rastreabilidade NBR 10004',
        url: 'https://www.rgambiental.com.br/gerenciamento-de-residuos-classe-i-iia-e-iib/',
        hint: 'Material consultivo',
      },
    ],
  },
  alerts: {
    intro: 'Alertas simulados para diretoria — em produção vêm do backend (WebSocket + regras SLA).',
  },
  legal: {
    hLgpd: 'LGPD e retenção',
    pLgpd:
      'Bases legais: execução de contrato e legítimo interesse para gestão de equipe de campo. Finalidades: validação de visitas, segurança operacional, cumprimento de SLA comercial e auditoria ambiental.',
    hRetention: 'Retenção sugerida (ajustar com jurídico)',
    pRetention:
      '• Telemetria bruta: 24 meses, depois agregação para heatmaps.\n• Check-ins e notas de visita: 24 meses.\n• Logs de sync: 12 meses.\n• Direitos: acesso, correção e portabilidade via canal RH/DPO.',
    hRanking: 'Ranking',
    pRanking:
      'Opt-in explícito; pseudônimo disponível; sem exposição de dados sensíveis. Evitar gamificação punitiva visível.',
  },
  agenda: {
    title: 'Agenda',
    subtitle: 'Semana, mapa embutido e paradas',
    gpsDemoTitle: 'Demonstração GPS',
    gpsDemoBody: 'Simula presença no cliente para validar geofence sem deslocamento.',
    noRoute: 'Sem rota para esta data (use cache após primeira sync).',
    todayChip: 'Hoje',
  },
  agendaMap: {
    embeddedTitle: 'Mapa no Android',
    embeddedBody:
      'Por estabilidade, o mapa nativo embutido está desativado no Android. Use o botão para abrir as paradas no Google Maps. No iPhone o mapa continua embutido.',
    openMaps: 'Abrir no Google Maps',
    centerApprox: 'Centro aproximado',
  },
  ota: {
    titleAvail: 'Atualização disponível',
    titleRestart: 'Reiniciando…',
    bodyDownload: 'Baixando…',
    bodyRestart: 'Aplicando e reiniciando o app.',
    bodyDefault: 'Uma nova versão do RG Consultor está pronta.',
    updateBtn: 'Atualizar',
    updateBtnA11y: 'Atualizar app agora',
    updateFailTitle: 'Atualização',
    updateFailBody: 'Não foi possível baixar a atualização. Tente mais tarde.',
  },
  store: {
    imagePlaceholderA11y: 'Imagem do prêmio indisponível',
    imageFailedLabel: 'Prévia indisponível',
  },
} as const;

export type Locale = 'pt-BR';

const catalogs: Record<Locale, typeof pt> = { 'pt-BR': pt };

let locale: Locale = 'pt-BR';

export function setLocale(l: Locale): void {
  locale = l;
}

export function t<K extends keyof typeof pt>(section: K): (typeof pt)[K] {
  return catalogs[locale][section];
}
