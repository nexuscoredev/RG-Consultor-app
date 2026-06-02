# API backend — Fase C

O RG Consultor pode operar em **modo mock** (offline, dados simulados) ou **modo API** (backend real no monorepo).

## 1. Arrancar a API

Na raiz do repositório:

```bash
npm install
npm run api
```

Servidor em **http://0.0.0.0:3001** (health: `/health`).

### Utilizadores demo

| E-mail | Senha | Perfil |
|--------|-------|--------|
| `vendedor@rg.com` | `rg2026` | Consultor (rotas, pipeline, sync) |
| `master@rg.com` | `rg2026` | Gestor (painel master) |

## 2. Ligar o app mobile

Crie `mobile/.env` (ou exporte variáveis antes do `expo start`):

```env
EXPO_PUBLIC_API_MODE=api
EXPO_PUBLIC_AUTH_MODE=api
EXPO_PUBLIC_API_BASE_URL=http://192.168.200.163:3001
```

Substitua o IP pelo **IP do PC na rede Wi‑Fi** (não use `localhost` no telemóvel físico).

| Ambiente | URL típica |
|----------|------------|
| Android emulator | `http://10.0.2.2:3001` |
| iOS simulator | `http://localhost:3001` |
| Telemóvel na mesma Wi‑Fi | `http://<IP-do-PC>:3001` |

Reinicie o Metro após alterar `.env`:

```bash
npm run mobile
```

## 3. Endpoints

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/health` | Status |
| POST | `/auth/login` | JWT + perfil |
| GET | `/auth/me` | Perfil (Bearer) |
| GET | `/me/routes/:date` | Rota do dia (`yyyy-mm-dd`) |
| GET | `/me/pipeline` | CRM / oportunidades |
| POST | `/sync/events` | Fila outbox (check-in, proposta, reunião) |
| GET | `/master/dashboard` | KPIs + equipa (só master) |

## 4. Sync offline

Check-ins, propostas e registos de reunião entram na **fila SQLite (outbox)**. Com API activa e token válido, a sync envia cada evento para `POST /sync/events` (automática ao voltar à app ou manual em **Configurações → Sincronizar**).

## 5. Produção (EAS)

No perfil EAS, defina secrets:

- `EXPO_PUBLIC_API_MODE=api`
- `EXPO_PUBLIC_AUTH_MODE=api`
- `EXPO_PUBLIC_API_BASE_URL=https://api.seudominio.com.br`

Altere `JWT_SECRET` no servidor (`apps/api`) e substitua utilizadores demo por base de dados real.
