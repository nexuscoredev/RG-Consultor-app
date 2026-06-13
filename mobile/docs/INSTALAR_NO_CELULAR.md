# Instalar o RG Consultor no celular ou tablet

## Tablet (ex.: Redmi Pad 2)

O layout adapta automaticamente em telas ≥ 600dp: botões maiores (56px), hub comercial em 2 colunas, mapa da agenda mais alto e barra de tabs centralizada. Gere o **APK preview** (abaixo) e instale no tablet; para modo quiosque (só o app RG), use MDM — ver `docs/ROADMAP_SPRINTS.md` Sprint 2.

## Desenvolvimento rápido (Expo Go)

1. Instale **Expo Go** na App Store ou Google Play.
2. No computador, na pasta `mobile`: `npm install` e `npx expo start`.
3. Escaneie o QR code com o app da câmera (iOS) ou com o Expo Go (Android).
4. Se estiver em outra rede, use túnel: `npx expo start --tunnel`.

## Build instalável (recomendado para demo real no aparelho)

1. Crie conta em [expo.dev](https://expo.dev) e faça login no CLI: `npx eas login`.
2. Na pasta `mobile`, configure o projeto EAS se ainda não existir: `npx eas build:configure`.
3. Gere um build **preview** (interno / APK ou equivalente):

   ```bash
   npx eas build --profile preview --platform android
   ```

   Repita com `--platform ios` se tiver Apple Developer e certificados.

4. Quando o build terminar, abra o link do EAS e instale o artefato no dispositivo (Android: APK direto; iOS: TestFlight ou perfil de desenvolvimento, conforme o perfil EAS).

**API no APK:** o perfil `preview` liga auth/API por defeito. Passe `EXPO_PUBLIC_API_BASE_URL` no build (`eas secret` ou `--env`) — ver `mobile/docs/STAGING.md` §5. Sem URL, o app cai em modo mock.

## Perfis de login (demonstração)

Por defeito o app usa **auth mock** (qualquer e-mail comercial + senha não vazia). Para testar com a API local:

1. Na pasta raiz: `npm run api` (porta 3001).
2. Em `mobile/.env`: `EXPO_PUBLIC_AUTH_MODE=api`, `EXPO_PUBLIC_API_MODE=api`, `EXPO_PUBLIC_API_BASE_URL=http://SEU_IP:3001`.
3. Reinicie o Expo.

Credenciais demo da API:

- **Consultor:** `vendedor@rg.com` / `rg2026`
- **Master:** `master@rg.com` / `rg2026` — painel consolidado no app e endpoint `/master/dashboard`.

## Painel web master

O projeto `apps/admin` é o painel executivo no navegador (`npm install` e `npm run dev` nessa pasta).
