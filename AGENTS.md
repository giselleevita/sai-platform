# AGENTS.md

## Cursor Cloud specific instructions

### Overview

SAI Platform is a Turborepo monorepo (npm workspaces) with an Express API (`apps/api`, port 3001), a Next.js frontend (`apps/web`, port 3000), and two shared packages (`packages/shared-types`, `packages/risk-scoring`). PostgreSQL 15 is the only required external service; Redis is optional and the API runs fine without it.

### Starting services

1. **PostgreSQL**: `docker compose up -d postgres` (uses `postgres:15-alpine`, credentials in `docker-compose.yml`).
2. **Database sync**: Use `cd apps/api && npx prisma db push --accept-data-loss` to sync the schema. The committed migration files are incomplete (the init migration only creates 4 of ~26 tables), so `prisma migrate deploy` will fail on a fresh DB. Use `prisma db push` instead.
3. **Dev servers**: `npm run dev` at repo root (runs Turbo in parallel: API + Web + package watchers).
4. **.env files**: Copy `apps/api/env.example` to `apps/api/.env` and `apps/web/env.example` to `apps/web/.env.local` if they don't exist. Defaults work for local dev.

### Testing

- `npm run test` — runs Jest tests in the API package (10 tests across 3 suites).
- `npm run lint` — runs ESLint on the web package. Pre-existing lint errors exist (64 errors, 54 warnings from `@typescript-eslint/no-explicit-any`, unused vars, etc.).
- `npm run test:mvp` and `npm run test:csrf` — shell-based E2E smoke tests (require running API).

### Gotchas

- The API logs Redis `ECONNREFUSED` errors continuously when Redis is not running. This is noisy but harmless; the API functions normally without Redis.
- Node.js v20.20.0 is required (`.nvmrc`). The `check:node` script enforces `>=20.9.0`.
- `prisma generate` runs automatically via the `postinstall` hook in `apps/api/package.json`.
- CSRF protection is enabled on all API routes except `/api/auth`. Mutating requests require `x-csrf-token` header matching the `csrfToken` returned from login/signup.
