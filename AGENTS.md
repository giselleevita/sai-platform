# AGENTS.md

## Cursor Cloud specific instructions

### Project Overview

SAI Platform is an enterprise AI governance SaaS monorepo (Turborepo + npm workspaces). See `README.md` for full details.

| Service | Port | Dev command |
|---------|------|-------------|
| API (Express) | 3001 | `cd apps/api && npm run dev` |
| Web (Next.js) | 3000 | `cd apps/web && npm run dev` |
| PostgreSQL | 5432 | `sudo docker compose up -d postgres` |

### Running the platform

1. **Start PostgreSQL**: `sudo docker compose up -d postgres` (required before API)
2. **Start Docker daemon** (if not running): `sudo dockerd &>/tmp/dockerd.log &` — wait ~3s before using Docker commands
3. **Database sync**: Use `npx prisma db push` from `apps/api/` (not `prisma migrate deploy` — the committed migrations are incomplete and will fail with `relation "Risk" does not exist`)
4. **Start dev servers**: `npm run dev` from root (runs API + Web in parallel via Turbo), or start individually
5. **Node.js version**: v20.20.0 per `.nvmrc` — use `source ~/.nvm/nvm.sh && nvm use 20.20.0`

### Key caveats

- **Prisma migrations are broken**: The init migration only creates 4 tables but the schema has 26 models. Always use `npx prisma db push` instead of `npx prisma migrate deploy` for dev setup.
- **Lint has pre-existing errors**: `npm run lint` exits non-zero due to ~118 ESLint issues in the web app (mostly `@typescript-eslint/no-explicit-any` and `react-hooks` warnings). This is expected.
- **CSRF protection**: All non-GET API requests require both a valid `access-token` cookie and a matching `X-CSRF-Token` header. Login response includes the CSRF token in the response body and sets it as a cookie.
- **Redis is optional**: The app gracefully degrades without Redis. No need to start it for development.
- **Environment files**: `apps/api/.env` from `apps/api/env.example`, `apps/web/.env.local` from `apps/web/env.example`. Default values work for local dev.

### Common commands

See `README.md` and `package.json` scripts. Key ones:

- `npm run dev` — start all services
- `npm run build` — build all packages
- `npm run test` — run Jest tests (3 suites, 10 tests)
- `npm run lint` — ESLint (pre-existing errors in web app)
- `npm run test:mvp` — shell-based E2E smoke tests
- `cd apps/api && npm run db:studio` — Prisma Studio (DB GUI)
