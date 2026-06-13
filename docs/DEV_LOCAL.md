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

### Desenvolvimento web (recomendado)

Sistema web Vite — sem Expo Go:

```powershell
npm run dev
# API em :3001 + app em http://localhost:5173
```

Ou só o frontend:

```powershell
npm run consultor
```

Guia: `apps/consultor/README.md`

Copie `apps/consultor/.env.example` para `apps/consultor/.env` se usar API real:

```env
VITE_API_MODE=api
VITE_API_BASE_URL=http://localhost:3001
```

### Mobile Expo (legado / nativo)

```powershell
npm run mobile:native
```

Para GPS, mapa embutido e builds de loja. O fluxo principal de desenvolvimento é o sistema web em `apps/consultor`.

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
