# Instalar o RG Consultor no celular

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

## Perfis de login (demonstração)

- **Consultor:** qualquer e-mail comercial + senha não vazia (ex.: `campo@rgambiental.com.br`).
- **Master / ADM:** e-mail começando com `master@` ou `admin@` (ex.: `master@rgambiental.com.br`) — abre o painel consolidado no app.

## Painel web master

O projeto `apps/admin` é o painel executivo no navegador (`npm install` e `npm run dev` nessa pasta).
