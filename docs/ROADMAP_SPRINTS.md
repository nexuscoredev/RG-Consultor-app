# Roadmap — 3 sprints (RG Consultor)

Plano para amadurecer o produto de campo: **API real → mapas Android → performance**.

Estado atual (baseline): app Expo 54, funil comercial 4 fases, outbox SQLite, API Express demo com persistência JSON.

---

## Sprint 1 — API real e sync (2 semanas)

**Objetivo:** consultores em produção com backend ligado; fila outbox sem eventos rejeitados.

### Entregas

| Item | Estado | Notas |
|------|--------|-------|
| Handlers `PROSPECTING_SAVED` e `PROPOSAL_ACCEPTED` na API | ✅ Feito | `apps/api/src/store.ts` |
| Outbox valida `accepted` / `rejected` da API | ✅ Feito | `mobile/lib/outbox.ts` |
| Schemas comerciais em `@rg-ambiental/shared` | ✅ Feito | `packages/shared/src/index.ts` |
| Documentação de eventos de sync | ✅ Feito | `mobile/docs/API_BACKEND.md` |
| `.env` de produção / staging | 🔲 | `EXPO_PUBLIC_API_MODE=api` + URL — ver `mobile/docs/STAGING.md` |
| `JWT_SECRET` forte no servidor | 🔲 | API recusa arranque em `NODE_ENV=production` sem secret |
| Substituir utilizadores demo por BD | 🔲 | Postgres ou Supabase |
| GET pipeline com `id`, `updatedAt`, `phase` | ✅ Feito | `apps/api/src/pipelineUtils.ts`, merge mobile |
| CI + smoke `POST /sync/events` | ✅ Feito | `.github/workflows/ci.yml`, `npm run api:smoke` |
| Alertas `/me/alerts` e `/master/alerts` | ✅ Feito | Mobile + admin web |
| PDF termo de intenção + minuta contrato | ✅ Feito | `documentTemplates.ts` |
| Admin web ligado à API | ✅ Feito | `apps/admin/src/api.ts` |

### Critérios de aceite

- Login `vendedor@rg.com` com API ligada; prospecção, proposta, aceite e contrato sincronizam sem falhas na outbox.
- Painel master reflete KPIs após sync.
- Configurações → Sincronizar mostra 0 pendentes / 0 falhas após fluxo completo.

### Como testar localmente

```powershell
cd C:\dev\RGConsultor
npm run api
npm run api:smoke
```

```env
# mobile/.env
EXPO_PUBLIC_API_MODE=api
EXPO_PUBLIC_AUTH_MODE=api
EXPO_PUBLIC_API_BASE_URL=http://<IP-PC>:3001
```

---

## Sprint 2 — Mapas Android e builds de campo (2 semanas)

**Objetivo:** mapa embutido na Agenda no Android (com chave Google); distribuição estável no telemóvel.

### Entregas

| Item | Estado | Notas |
|------|--------|-------|
| `AgendaRouteMap.android.tsx` com Google Maps condicional | ✅ Feito | Só ativa com chave EAS |
| Helper `isNativeMapsEnabled()` | ✅ Feito | `mobile/lib/mapsConfig.ts` |
| Perfil EAS `preview` + docs APK | ✅ Feito | `mobile/eas.json`, `STAGING.md` |
| Secret `GOOGLE_MAPS_ANDROID_API_KEY` no EAS | 🔲 | `eas secret:create` |
| Build preview APK para equipa | 🔲 | `eas build -p android --profile preview` |
| Testar mapa em dispositivo físico | 🔲 | Sem crash em scroll da Agenda |
| Documentar Maps + SHA-1 Play Console | 🔲 | `mobile/docs/INSTALAR_NO_CELULAR.md` |
| iOS: validar MapKit em build release | 🔲 | Já funciona em dev |

### Comandos EAS

```bash
cd mobile
eas secret:create --name GOOGLE_MAPS_ANDROID_API_KEY --value <sua-chave>
eas build --platform android --profile preview
```

---

## Sprint 3 — Performance e escala (2 semanas)

**Objetivo:** app fluido em dia de rota cheio; menos bateria e bundle mais enxuto.

### Entregas

| Item | Estado | Notas |
|------|--------|-------|
| Pipeline com `FlatList` | ✅ Feito | `commercial/pipeline.tsx` |
| GPS: intervalo 45s / 60m (vs 22s) | ✅ Feito | `index.tsx`, `agenda.tsx` |
| Agenda paradas em `FlatList` | ✅ Feito | `agenda.tsx` |
| Histórico meeting-log / prospecção / aceite limitado | ✅ Feito | `commercialStorage.ts`, UI 30 itens |
| Sync outbox só em foreground | ✅ Feito | `SyncContext.tsx` — 120s |
| Erros API amigáveis + 401/timeout | ✅ Feito | `apiClient.ts`, `apiErrors.ts` |
| Dividir `commercialContent.ts` por fase | 🔲 | Bundle opcional |
| `expo-atlas` + meta de bundle | 🔲 | CI opcional |
| Cache offline vídeos showroom | 🔲 | `expo-file-system` |

---

## Visão pós-sprint 3

| Área | Próximo passo |
|------|----------------|
| CRM | Fase enum ✅ — próximo: leads com servidor dedicado |
| Documentos | PDF termo + contrato ✅ — próximo: templates jurídicos aprovados |
| Admin web | API ligada ✅ — próximo: WebSocket posição GPS |
| Web mobile | Manter preview-only; não substituir app nativo |

---

## Referências

- API: `mobile/docs/API_BACKEND.md`, `docs/DEV_LOCAL.md`, `mobile/docs/STAGING.md`
- Instalação: `mobile/docs/INSTALAR_NO_CELULAR.md`
- Funil: `mobile/lib/commercialFunnel.ts`
