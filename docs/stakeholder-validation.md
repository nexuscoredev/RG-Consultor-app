# Validação com stakeholders — RG Ambiental Super App

Documento para alinhamento de negócio, KPIs, gamificação e LGPD antes do hardening de produção.

## Personas (confirmar titulares)

| Persona | Objetivo principal | Métrica de sucesso sugerida |
|--------|----------------------|-----------------------------|
| Vendedor de campo | Converter visitas em próximos passos (proposta, coleta, documentação) | Taxa de visitas com outcome registrado |
| Gestor comercial / CS | Cobertura da carteira e cumprimento de rota | Visitas realizadas vs planejadas; SLA de follow-up |
| Diretoria / Operações | Visibilidade e compliance | Check-ins válidos; tempo em cliente; alertas de desvio |

**Ações:** nomear responsável por persona; validar se “cliente final” terá portal no roadmap (fora do MVP).

---

## Missões e gamificação (decisões pendentes)

Definir com RH/comercial para evitar distorção de comportamento (volume sem qualidade).

1. **Metas semanais:** quais indicadores entram no Mission Center? (ex.: visitas com check-in válido, propostas enviadas, novos MQLs)
2. **Pesos:** visita simples vs visita com proposta vs fechamento — como pontuar?
3. **Ranking:** opt-in individual? exibir só top N? ocultar quem está abaixo da média?
4. **Badges:** lista inicial de marcos e critérios objetivos (ex.: “Mestre da Sustentabilidade” = X visitas válidas + 100% check-in na semana)
5. **Anti-toxicidade:** limite de horas fora do expedite para contagem? pausa para intervalo?

**Status:** checklist — agendar workshop de 60 min com comercial + RH + jurídico.

---

## KPIs executivos (dashboard admin)

Priorizar 5–7 KPIs na primeira versão:

| KPI | Fórmula / fonte | Dono |
|-----|------------------|------|
| Visitas planejadas vs realizadas | Agenda vs check-in | Gestor |
| Taxa de check-in válido (geofence) | Check-ins OK / check-ins tentados | Operações |
| Cobertura geográfica | Paradas únicas por região / período | Diretoria |
| Conversão por etapa do funil | CRM / pipeline | Comercial |
| Cumprimento de missões | Mission Center agregado | Comercial |
| SLA de resposta a leads | CRM | Comercial |
| Alertas ativos | Desvio de rota, check-in falho, offline prolongado | Operações |

**Ações:** validar fonte de verdade do CRM (integração nativa vs exportação).

---

## LGPD e geolocalização

1. **Base legal:** execução de contrato e legítimo interesse (gestão de equipe de campo) — confirmar com jurídico.
2. **Transparência:** política de privacidade in-app; tela de consentimento para rastreamento em background.
3. **Minimização:** coletar apenas o necessário; agregar posições antigas para heatmaps quando possível.
4. **Retenção:** prazo de guarda de trilha de GPS e logs de visita (ex.: 12 / 24 meses).
5. **Acesso:** perfis (`vendedor`, `gestor`, `executivo`, `admin`) com segregação de dados.
6. **Ranking:** não publicar dados sensíveis; opção de pseudônimo no leaderboard.

**Ações:** DPIA resumido; registro de consentimento com timestamp e versão da política.

---

## Sign-off

| Tema | Nome | Data | OK |
|------|------|------|-----|
| Metas e ranking | | | ☐ |
| KPIs dashboard | | | ☐ |
| LGPD / rastreamento | | | ☐ |
