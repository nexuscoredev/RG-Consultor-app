# Contratos REST (MVP)

Base URL: `https://api.rg-ambiental.example/v1`  
Auth: `Authorization: Bearer <JWT>` (OIDC no roadmap)

## Rotas e paradas

| Método | Rota | Request | Response |
|--------|------|---------|----------|
| GET | `/me/routes/today` | — | `RotaDia` |
| GET | `/me/routes?from=&to=` | query ISO dates | `RotaDia[]` |

Schemas: `@rg-ambiental/shared` — `RotaDiaSchema`, `ParadaSchema`.

## Visitas e check-in

| Método | Rota | Request | Response |
|--------|------|---------|----------|
| POST | `/visits/check-in` | `CheckInPayload` | `{ visitaId, valid, distanceM }` |
| POST | `/visits/check-out` | `CheckInPayload` | `{ visitaId, valid, distanceM }` |

Validação servidor: distância Haversine entre `geo` do payload e `parada.geo` ≤ `parada.geofenceRadiusM`.

## Live tracking (ingestão)

| Método | Rota | Request | Response |
|--------|------|---------|----------|
| POST | `/telemetry/positions` | `{ pings: PositionPing[] }` | `{ accepted: number }` |

Admin subscreve `ws://.../live` com evento `position` (payload `PositionPing`).

## Missões e ranking

| Método | Rota | Response |
|--------|------|----------|
| GET | `/me/missions` | `MissionProgress[]` |
| GET | `/me/badges` | `Badge[]` |
| GET | `/leaderboard/weekly` | `RankingEntry[]` |
