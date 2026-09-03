# SAI Platform — AI Governance & Compliance

**Track every AI tool an organization uses, score its risk, and produce the audit trail regulators ask for.**

SAI Platform is a self-hosted system for AI inventory, risk assessment, and compliance evidence, built against the control structure of the EU AI Act and NIS2. It is a multi-tenant TypeScript monorepo (Next.js frontend, Express/Prisma API, PostgreSQL) with 41 Prisma-modeled entities, 30 API controllers, and 41 backend services.

## What it does

- **AI Tool Inventory** — register and categorize every AI tool in use, with risk scoring per tool.
- **Risk Management** — likelihood/impact assessment with an accept/defer/reject decision trail and management sign-off.
- **Compliance & Governance** — policy and control registry, evidence tracking with expiry and approval status, EU AI Act control mapping (see [`docs/EU_AI_ACT_MAPPING.md`](docs/EU_AI_ACT_MAPPING.md)).
- **Incident Tracking** — full incident lifecycle with severity classification and reporting deadlines.
- **Audit Logging** — activity feed and audit trail across tenants, exportable for review.
- **Reporting** — PDF report generation, Excel import/export, webhooks for external integrations.

## Multi-tenant isolation

Every domain object (evidence, risks, incidents, vendors) is scoped by company at the query layer, not just the UI. This is the part most internal tools get wrong, so it has direct test coverage rather than being asserted:

```
apps/api/src/__tests__/evidence-tenant-scope.test.ts
apps/api/src/__tests__/risk-tenant-scope.test.ts
apps/api/src/__tests__/incident-tenant-scope.test.ts
apps/api/src/__tests__/vendor-tenant-scope.test.ts
apps/api/src/__tests__/exception-tenant-scope.test.ts
```

## Security

- JWT auth in httpOnly cookies with CSRF protection (covered by `csrf.middleware.test.ts` and `csrf.integration.test.ts`)
- RBAC with permission enforcement at the middleware layer
- Zod schema validation on API input
- Multi-tier rate limiting (API, auth, reports)
- Soft deletes with audit trail

## Tech stack

- **Frontend**: Next.js 16, React, TypeScript, Tailwind CSS
- **Backend**: Node.js, Express, TypeScript, Prisma ORM
- **Database**: PostgreSQL (Neon-compatible), 20 versioned migrations
- **Auth**: JWT / httpOnly cookies, OIDC, SCIM
- **Testing**: Jest — 27 test files covering auth, tenant isolation, CSRF, billing, and email delivery

## Architecture

```
sai-platform/
├── apps/
│   ├── web/          # Next.js frontend dashboard
│   └── api/          # Node.js/Express backend, Prisma schema + migrations
├── packages/
│   ├── shared-types/     # Shared TypeScript types
│   └── risk-scoring/     # Risk calculation algorithms
├── docs/             # Setup, architecture, deployment, API reference
└── scripts/          # Utility scripts
```

## Quick start

**Prerequisites:** Node.js v20.9+, npm v9+, Docker (for local Postgres).

```bash
npm install
npm run setup      # provisions local DB, runs migrations
npm run dev
```

- Frontend: http://localhost:3000
- API: http://localhost:3001
- API docs (OpenAPI): http://localhost:3001/api-docs

Set `JWT_SECRET` in `apps/api/.env` before sharing an environment — `npm run setup` generates one for local use only.

## Documentation

- **[Getting Started](docs/GETTING_STARTED.md)** — full setup guide
- **[How It Works](docs/HOW_IT_WORKS.md)** — architecture and data flow
- **[Structure](docs/STRUCTURE.md)** — code organization
- **[API Reference](docs/API_ROUTES_COMPLETE.md)** — endpoint documentation
- **[Deployment](docs/DEPLOYMENT.md)** — production deployment guide
- **[CI/CD](docs/CI_CD.md)** — pipeline configuration
- **[Troubleshooting](docs/TROUBLESHOOTING.md)**

## Development

### Common commands

```bash
npm run dev             # start all services
npm run build           # build all packages
npm run test            # run the Jest suite
npm run test:mvp        # core end-to-end smoke flow
npm run test:csrf       # CSRF/auth behavior smoke flow

cd apps/api
npm run db:studio       # Prisma Studio (DB GUI)
npm run db:migrate      # run migrations
```

### CI

GitHub Actions runs a **Quality Gate** (build, `npm test`, CSRF security gate) and a **Sprint smoke** job (Postgres service, API build, integration smoke) on every PR to `main`.

## Known gaps

Being direct about what's not yet covered, rather than claiming otherwise:

- No frontend test coverage yet (`apps/web` has no `.test.tsx` files) — API and tenant-isolation logic is tested, UI is not.
- The full-flow e2e coverage ([`tests/api/test-mvp-happy-path.sh`](tests/api/test-mvp-happy-path.sh): auth → inventory → risk → policy/control → evidence → report) exercises the API directly over HTTP. There is no browser-level test (Playwright/Cypress) driving the actual UI.
- Backend Jest coverage is concentrated on auth, tenant isolation, CSRF, and billing — not yet on every service.

These are the current priorities for hardening the project further.

## Deployment

Designed for:
- **AWS ECS Fargate** — containerized API
- **Neon** — managed PostgreSQL with SSL
- **S3 + CloudFront** (or Vercel) — static frontend hosting
- **Redis** (optional) — caching layer

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for details.

## License

Private — All rights reserved.
