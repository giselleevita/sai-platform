# Quick Reference - MVP Smoke Test

## Prerequisites

```bash
# 1) Start local stack
npm run setup

# 2) Start app servers
npm run dev
```

## Run the MVP Flow

```bash
# In a second terminal
npm run test:mvp
```

This script validates the core local MVP flow end-to-end:

1. Signup user
2. Create AI tool (inventory)
3. Create risk
4. Create policy + control
5. Create evidence
6. Generate risk report

## Sprint smoke (health + `/api/health` + OIDC + email mode + bad login)

The script checks `GET /health`, `GET /api/health`, `GET /api/health/oidc` (`oidcEnabled`), `GET /api/health/email` (resolved `mode`, no secrets), **`GET /api-docs`** (OpenAPI `3.0.0` + inventory governance paths), then `POST /api/auth/login` with bad credentials (expects `401`).

Requires the API listening on `http://localhost:3001` (for example `npm run dev` from the repo root, or run only `apps/api`).

```bash
# Optional: compile only the API workspace (shared-types, risk-scoring, api) — skips Next.js web build
npm run build:api

# Hit the sprint smoke script (same as CI `sprint-smoke` job after migrate + start)
npm run test:sprint

# One-liner: build API graph, then run sprint smoke (still needs a running API)
npm run test:api-smoke

# Full local run (Docker): Postgres → migrate → build API → start API → test:sprint → stop API
# Leaves Postgres running for reuse with npm run dev
npm run test:sprint:local
```

## Run CSRF/Auth Smoke

```bash
npm run test:csrf
```

This script verifies CSRF protection behavior explicitly:

1. Protected write without CSRF header returns `401`.
2. Protected write with CSRF header returns `201`.

## Expected Result

- Command exits with code `0`
- Output includes `✅ Flow complete` (for MVP flow)
- Output includes `CSRF/auth smoke test passed` (for CSRF flow)
- Sprint smoke ends with `✅ Sprint smoke passed.`

## Common Failures

- `Invalid CSRF token`
  - Run the flow only through `npm run test:mvp` (it manages cookie + CSRF state automatically).
  - Run `npm run test:csrf` to verify expected failure/success behavior explicitly.
- `connect ECONNREFUSED`
  - API is not running on `http://localhost:3001`.
- Prisma/DB errors
  - Ensure Docker is running and rerun `npm run setup`.

## Production / staging email checklist

Before relying on notifications in a deployed environment:

1. Set `EMAIL_PROVIDER` to `smtp`, `sendgrid`, or `ses` (see `apps/api/env.example`).
2. Provide the matching secrets (SMTP credentials, `SENDGRID_API_KEY` + `SENDGRID_FROM`, or `SES_FROM` + `AWS_REGION` + AWS credentials / IAM role).
3. Send a **single test** from staging (e.g. trigger a flow that calls `EmailService` or add a temporary admin-only test route in a branch).
4. Confirm messages are not landing in spam; rotate keys if leaked; never commit API keys to git.
5. After deploy, you can sanity-check config with **`GET /api/health/email`** (returns `mode` only — e.g. `sendgrid`, `ses`, `none`).

## Tool governance (inventory) — manual check

OpenAPI schemas: **`GET /api-docs`** (JSON). Inventory tool governance is stored on **`AITool.customFields.toolGovernance`** (profile + tool-scoped decision logs; separate from Risk **`DecisionLog`**).

With an authenticated session (cookies from login, CSRF token on writes — same rules as other protected routes):

| Method | Path | Notes |
|--------|------|--------|
| `GET` | `/api/inventory/:id/governance` | Merged profile (persisted + demo fallback by tool name). `TOOL_READ` |
| `PATCH` | `/api/inventory/:id/governance` | Persist profile fields. `TOOL_WRITE` |
| `GET` | `/api/inventory/:id/decisions` | Decision history, newest first. `TOOL_READ` |
| `POST` | `/api/inventory/:id/decisions` | Body `{ "decision": "...", "rationale": "..." }`. `TOOL_WRITE` |

For end-to-end local validation, prefer **`npm run test:mvp`** (handles auth/CSRF) or exercise the routes from a client that sends cookies + `X-CSRF-Token`.
