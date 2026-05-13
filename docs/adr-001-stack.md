# ADR 001 — Stack do Super App RG Ambiental

## Status

Aceito (protótipo e MVP alinhados ao plano de produto).

## Contexto

É necessário um app mobile fluido (animações, mapas, vídeo), **offline-first** para rotas e contatos, integração com **Google Maps / Waze** via deep links, e um backend escalável com **geolocalização** e **painel executivo**.

## Decisão

| Camada | Escolha | Motivo |
|--------|---------|--------|
| Mobile | **React Native (Expo)** + **Expo Router** | Ecossistema maduro (maps, location, av), reaproveitamento de TypeScript com web admin futuro em React, time full-stack JS |
| UI | React Native + StyleSheet / tema tokens | Performance previsível; evita CSS pesado no mobile |
| Vídeo | **expo-av** | Player nativo; suporta progresso para capítulos; HLS conforme plataforma |
| Estado local / offline | **expo-sqlite** + fila **outbox** (tabela) | MVP sem WatermelonDB; migração possível se volume de dados crescer |
| Backend (MVP recomendado) | **NestJS** + **PostgreSQL** + **PostGIS** | OpenAPI, módulos, tipos compartilháveis com Zod gerado ou manual |
| Tempo real | **WebSockets** (Socket.IO ou gateway WS nativo) + **Redis** pub/sub | Live tracking no admin |
| Auth | OIDC-ready (JWT no MVP) | Substituir por provedor corporativo depois |

## Alternativa considerada

- **Flutter:** excelente para UI custom pesada; não escolhido para maximizar reuso TS/React com painel web e equipe JS.

## Consequências

- Config plugins Expo para background location exigem build nativo (EAS).
- Contratos de API versionados em `packages/shared` (Zod) para mobile e NestJS consumirem os mesmos shapes.
