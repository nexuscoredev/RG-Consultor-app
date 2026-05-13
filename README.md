# RG Ambiental — Super App (protótipo)

Monorepo npm workspaces: `packages/shared`, `mobile` (Expo) e `apps/admin` (Vite + mapa executivo).

```bash
cd super-app-rg-ambiental
npm install
npm run build --workspace=@rg-ambiental/shared
npm run start --workspace=mobile
```

- **Primeiro uso:** fluxo `Login` → consentimento LGPD → abas **Início / Agenda / Mais**.
- **Admin:** `npm run admin` (mapa OSM + KPIs mockados).
- **Testes:** `npm run test:geo` (Haversine).
- **Mapas Android:** configure chave Google Maps e plugin `react-native-maps` se os tiles não carregarem.
- Documentação: `docs/` (inclui `TRAINING.md`, `store-listing-pt-BR.md`).
