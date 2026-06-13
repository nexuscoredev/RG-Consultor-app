# Staging / API real — consultor em campo

Guia para testar o app com backend ligado (tablet ou telemóvel na mesma rede que o PC).

## 1. Subir a API

```powershell
cd C:\dev\RGConsultor
npm run api
```

A API escuta em `http://0.0.0.0:3001` (ver `apps/api`).

## 2. Configurar o mobile

Copie `mobile/.env.example` → `mobile/.env` e ajuste o **IP do PC** na rede local:

```env
EXPO_PUBLIC_API_MODE=api
EXPO_PUBLIC_AUTH_MODE=api
EXPO_PUBLIC_API_BASE_URL=http://192.168.1.26:3001
```

> Use o IP LAN do PC (`ipconfig` no Windows). Tablet e PC devem estar na **mesma Wi‑Fi**.

Modo demo (sem servidor):

```env
EXPO_PUBLIC_API_MODE=mock
```

Ou remova o `.env` — o app usa mock por defeito.

## 3. Reiniciar o Expo

Após alterar `.env`, reinicie o Metro:

```powershell
npm run mobile
```

No tablet: Expo Go → escanear QR ou `exp://<IP-PC>:8081`.

## 4. Validar sync

1. Login: `vendedor@rg.com` / `rg2026`
2. Check-in numa parada → Configurações → **Sincronizar**
3. Fila deve mostrar **0 pendentes** após sync (com API ligada)
4. Prospecção / proposta / aceite / contrato → verificar em Configurações que não há falhas na outbox

## 5. APK preview (EAS)

Para distribuir sem Expo Go (APK interno, perfil `preview` em `mobile/eas.json`):

```bash
cd mobile
npx eas login
npx eas build --platform android --profile preview
```

O perfil `preview` já define `EXPO_PUBLIC_API_MODE=api` e `EXPO_PUBLIC_AUTH_MODE=api`. **Defina a URL da API no build** — variáveis `EXPO_PUBLIC_*` ficam embutidas no APK:

```bash
# Uma vez: secret no EAS (substitua pelo IP/host real)
npx eas secret:create --name EXPO_PUBLIC_API_BASE_URL --value http://192.168.1.26:3001 --scope project

# Ou inline só neste build:
npx eas build --platform android --profile preview \
  --env EXPO_PUBLIC_API_BASE_URL=http://192.168.1.26:3001
```

> Para demo só offline, use `--env EXPO_PUBLIC_API_MODE=mock` (ignora o secret).

Após o build, abra o link do EAS no tablet Android e instale o APK. Ver também `mobile/docs/INSTALAR_NO_CELULAR.md` e `docs/ROADMAP_SPRINTS.md` (Sprint 2).

## Checklist rápido

| Item | OK? |
|------|-----|
| `npm run api` responde em `:3001` | |
| `.env` com IP correto | |
| Login com API | |
| Rota do dia carrega (não só mock) | |
| Outbox sincroniza sem falhas | |
| Pipeline reflete registos locais + API | |
