# RG Consultor — sistema web

App web para consultores de campo (tablet e celular). Stack: **Vite + React + React Router**.

## Problemas comuns

### Tela em branco / erro no console

Causa: duas versões do React no monorepo. Já corrigido com React `19.1.0` + `dedupe` no Vite. Se voltar:

```powershell
cd C:\dev\RGConsultor
Remove-Item -Recurse -Force apps\consultor\node_modules -ErrorAction SilentlyContinue
npm install react@19.1.0 react-dom@19.1.0 --workspace=consultor
npm run consultor
```

### Porta já em uso (5173 ou 3001)

Processos antigos ficam abertos. Reinicie limpo:

```powershell
npm run dev:clean
```

Ou manualmente: feche terminais com `npm run consultor` / `npm run api` e rode de novo.

### Login não funciona

- Com API: confirme `npm run api` e `http://localhost:3001/health` retorna OK
- Credenciais: `vendedor@rg.com` / `rg2026`
- Sem API: em `apps/consultor/.env` use `VITE_API_MODE=mock` (qualquer e-mail/senha)

## Desenvolvimento

```powershell
cd C:\dev\RGConsultor
npm install

# API + app (recomendado)
npm run dev

# Só o frontend
npm run consultor
```

Abre **http://localhost:5173**

## Instalar no tablet ou celular (PWA)

1. No PC, na raiz do projeto: `npm run dev` (API + app).
2. Tablet na **mesma Wi‑Fi** que o PC.
3. Abra no tablet:

   **http://192.168.1.26:5173** (substitua pelo IP do seu PC — veja no terminal do Vite ou em `/instalar`)

4. Instalar:
   - **Android:** Chrome → menu → Instalar app
   - **iPad:** Safari → Compartilhar → Adicionar à Tela de Início

Página com instruções: **http://192.168.1.26:5173/instalar**

Se o tablet não abre, permita as portas **5173** e **3001** no Firewall do Windows.


### Variáveis de ambiente

Copie `.env.example` para `.env`:

```env
VITE_API_MODE=api
VITE_API_BASE_URL=http://localhost:3001
```

Login demo (com API): `vendedor@rg.com` / `rg2026`

## Deploy

```powershell
npm run consultor:build
# Saída em apps/consultor/dist
```

### Vercel

1. Root Directory: `apps/consultor`
2. Build: `npm run build`
3. Output: `dist`
4. Env: `VITE_API_BASE_URL=https://sua-api.exemplo.com`

### Netlify / nginx

Publique a pasta `dist`. Configure SPA fallback para `index.html` (já incluído em `vercel.json`).

## Rotas

| Rota | Tela |
|------|------|
| `/` | Início |
| `/agenda` | Paradas do dia |
| `/comercial` | Funil comercial |
| `/comercial/pipeline` | Pipeline |
| `/comercial/clientes` | Clientes |
| `/comercial/proposta` | Proposta PDF |
| `/comercial/:slug` | Ferramentas do kit |
| `/configuracoes` | Conta e API |

## Mobile Expo (legado)

O projeto `mobile/` (Expo) permanece no repositório para builds nativos, mas **não é mais o fluxo principal de desenvolvimento**. Use `npm run mobile:native` apenas se precisar de GPS nativo ou loja de apps.
