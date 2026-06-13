# RG Consultor — desenvolvimento web (sem Expo Go)

O mesmo código do projeto **já corre no navegador**. Não é preciso reescrever o app nem usar Expo Go para desenvolver a maior parte das funcionalidades.

## Início rápido

```powershell
cd C:\dev\RGConsultor
npm install

# Terminal 1 — API (opcional, modo demo funciona sem)
npm run api

# Terminal 2 — app no browser (abre http://localhost:8083)
npm run web
```

Ou os dois de uma vez:

```powershell
npm run dev
```

Login demo: `vendedor@rg.com` / `rg2026`

## Porquê web primeiro?

| Vantagem | Detalhe |
|----------|---------|
| Sem Expo Go | Abre direto no Chrome/Edge |
| Hot reload | Alterações nas telas aparecem na hora |
| DevTools | Console, rede, React — tudo do browser |
| Tablet | Redimensione a janela ou use modo dispositivo (F12) |
| Partilha | Envie o URL da rede local à equipa |

## API na web

Com API local, use **localhost** (não o IP da rede):

```env
# mobile/.env
EXPO_PUBLIC_API_MODE=api
EXPO_PUBLIC_AUTH_MODE=api
EXPO_PUBLIC_API_BASE_URL=http://localhost:3001
```

Reinicie `npm run web` após mudar o `.env`.

## O que funciona na web

- Login, tabs, funil comercial, clientes, pipeline, prospecção, aceite
- Rascunhos (AsyncStorage), outbox (memória SQLite), gamificação
- PDFs: **Imprimir → Guardar como PDF** no browser
- Layout tablet (largura ≥ 600px / 900px)

## Limitações na web (vs. telemóvel)

| Recurso | Web |
|---------|-----|
| Mapa na agenda | Lista + links Google Maps (sem mapa embutido) |
| GPS / check-in real | Use **demo GPS** em Configurações ou modo mock |
| Biometria | Não disponível |
| Dados SQLite | Memória — **recarregar a página apaga** visitas/outbox não sincronizados |
| OTA updates | Ignorado no browser |

Para testar mapa e GPS reais, use `npm run mobile:native` + emulador ou build EAS.

## Build estático (deploy)

```powershell
cd mobile
npx expo export --platform web
# Saída em mobile/dist

# Servir localmente
npx serve dist -p 8080
```

Para produção: publique `mobile/dist` em Netlify, Vercel, Cloudflare Pages ou nginx. Configure `EXPO_PUBLIC_*` no build.

## Scripts úteis

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | API + web em paralelo |
| `npm run web` | Só o app no browser |
| `npm run mobile:native` | Expo clássico (QR / Android / iOS) |
| `npm run web:build` | Export estático para `mobile/dist` |

## Migrar totalmente para “só web”?

**Não é obrigatório.** Este repositório usa **Expo + React Native Web**: um código, três plataformas. Se no futuro quiser **apenas** web sem React Native, seria um projeto novo (ex.: Next.js) — custo alto, pouco ganho agora.

O caminho recomendado: **desenvolver na web**, publicar `dist` para consultores em campo no browser, e manter builds nativos só se precisar de GPS offline ou loja de apps.
