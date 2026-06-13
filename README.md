# RG Ambiental — Consultor

Monorepo npm workspaces: `apps/consultor` (sistema web), `apps/api`, `apps/admin`, `packages/shared`, `mobile` (Expo legado).

```bash
cd C:\dev\RGConsultor
npm install
npm run build --workspace=@rg-ambiental/shared
npm run dev
```

- **Sistema web (principal):** `npm run dev` → API `:3001` + app `http://localhost:5173`
- **Login demo:** `vendedor@rg.com` / `rg2026`
- **Admin:** `npm run admin` (mapa gestor)
- **Mobile nativo (legado):** `npm run mobile:native`
- Documentação: `docs/`, `apps/consultor/README.md`
