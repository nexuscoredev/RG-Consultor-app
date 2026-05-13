# Estratégia offline-first e outbox

## Princípios

1. **Leitura offline:** rotas do dia, paradas, contatos e capítulos do showroom (metadados + URL de vídeo em cache opcional) persistidos em SQLite após sync.
2. **Escrita offline:** check-ins, notas e eventos de localização entram em fila **outbox** com estado `pending | sending | failed | synced`.
3. **Conflitos:** last-write-wins com `updatedAt` no servidor; auditoria append-only para visitas críticas (fase 2).

## Tabela `outbox` (MVP)

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | TEXT PK | UUID local |
| type | TEXT | `CHECK_IN`, `CHECK_OUT`, `NOTE`, `LOCATION_BATCH` |
| payload | TEXT | JSON serializado |
| createdAt | INTEGER | epoch ms |
| status | TEXT | pending / sending / failed / synced |
| retries | INTEGER | contador |

## Sync

- Ao voltar online: worker processa `pending` em ordem FIFO.
- Backoff exponencial em `failed` com limite de retries; superfície de UI para “reenviar”.

## Mapas offline

- Tiles completos: complexo no MVP; usar **snapshot** estático (coordenadas + endereço) na ficha da parada.
- Navegação: sempre **deep link** para Maps/Waze (funciona se houver rede mínima no SO).
