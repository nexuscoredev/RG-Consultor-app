# Deploy — RG Consultor (Vercel + Supabase + GitHub)

Fluxo recomendado: **push no GitHub** → CI valida → **Vercel** publica o frontend automaticamente. **Supabase** cuida do login em produção.

## 1. GitHub

O repositório já tem CI em `.github/workflows/ci.yml` (typecheck, build, smoke).

```bash
git add .
git commit -m "feat: consultor web tablet + deploy"
git push origin main
```

## 2. Vercel (frontend)

### Opção A — Root do monorepo (recomendado)

1. [vercel.com](https://vercel.com) → **Add New Project** → importe o repo GitHub.
2. **Root Directory:** deixe a raiz (`RGConsultor`) — o `vercel.json` na raiz já define build e output.
3. **Framework Preset:** Other
4. Variáveis de ambiente (Production):

| Variável | Valor |
|----------|--------|
| `VITE_API_MODE` | `api` ou `mock` |
| `VITE_API_BASE_URL` | URL pública da API (ex. Railway/Fly) **ou** omitir se só Supabase Auth |
| `VITE_AUTH_PROVIDER` | `supabase` |
| `VITE_SUPABASE_URL` | `https://xxxx.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | chave anon do projeto |

5. Deploy → URL exemplo: `https://rg-consultor.vercel.app`

### Opção B — Só `apps/consultor`

Root Directory: `apps/consultor` (usa o `vercel.json` local).

## 3. Supabase (autenticação)

### Criar projeto

1. [supabase.com/dashboard](https://supabase.com/dashboard) → New project.
2. **Settings → API** → copie **Project URL** e **anon public** key para Vercel.

### Usuários demo

**Authentication → Users → Add user**

| E-mail | Senha | User Metadata (JSON) |
|--------|-------|----------------------|
| `vendedor@rg.com` | `rg2026` | `{"role":"seller","display_name":"Consultor Demo","seller_id":"22222222-2222-2222-2222-222222222222","region":"SP"}` |
| `master@rg.com` | `rg2026` | `{"role":"master","display_name":"Gestor Demo","seller_id":"11111111-1111-1111-1111-111111111111","region":"SP"}` |

Ou execute o SQL em `supabase/seed.sql` após criar os usuários no Auth.

### Auth no app

Com `VITE_AUTH_PROVIDER=supabase` e as keys configuradas, o login usa Supabase. Localmente pode manter `VITE_AUTH_PROVIDER=api` e `npm run api`.

## 4. API de negócio (opcional em produção)

O app em Vercel pode usar:

- **Só Supabase Auth** + `VITE_API_MODE=mock` (dados locais no browser), ou
- **API hospedada** (Railway, Fly, etc.) com `VITE_API_BASE_URL=https://sua-api.exemplo.com`

A API demo (`apps/api`) pode ser deployada separadamente; configure CORS se necessário.

## 5. Tablet (Redmi Pad 2)

Após deploy, abra a URL Vercel no tablet e **Adicionar à tela inicial** (PWA).

Para dev na rede local: `http://IP-PC:5173` — ver `apps/consultor/README.md`.

## Checklist rápido

- [ ] Repo no GitHub
- [ ] Projeto Vercel ligado ao repo
- [ ] Env vars Vercel (Supabase + API se usar)
- [ ] Usuários criados no Supabase Auth
- [ ] Login testado na URL de produção
- [ ] PWA instalado no Redmi Pad 2
