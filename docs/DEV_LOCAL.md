# Desenvolvimento local (sem OneDrive / Google Drive)

O projeto deve ficar em pasta **fora** de sincronização em nuvem (ex.: `C:\dev\RGConsultor`).

## Porquê

- `node_modules` e `.expo` geram dezenas de milhares de ficheiros — OneDrive/Drive deixam Metro, Git e `npm` lentos.
- O código versiona-se com **Git**, não com pasta sincronizada.

## Setup (uma vez)

```powershell
cd C:\dev\RGConsultor
npm install
```

### Mobile (Expo)

```powershell
npm run mobile
# ou: cd mobile && npx expo start
```

Copie `mobile/.env.example` para `mobile/.env` se usar API real:

```env
EXPO_PUBLIC_API_MODE=api
EXPO_PUBLIC_AUTH_MODE=api
EXPO_PUBLIC_API_BASE_URL=http://SEU_IP:3001
```

### API local

```powershell
npm run api
```

Demo: `vendedor@rg.com` / `rg2026` · `master@rg.com` / `rg2026`

## Pastas que não devem ir para nuvem

- `node_modules/`
- `mobile/.expo/`
- `mobile/web-build/`
- `apps/api/data/` (persistência demo da API)

## Cursor

Abra **File → Open Folder →** `C:\dev\RGConsultor`.

## Backup

Use `git push` para o remoto GitHub — não dependa de OneDrive para o repositório.
