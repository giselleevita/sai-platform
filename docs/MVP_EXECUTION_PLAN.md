# SAI Platform MVP Execution Plan

Last updated: 2026-02-12

## 1) MVP Scope

### User story
A compliance manager can log in, register one AI tool, assess its risk, attach evidence, and export a basic report in a single local environment.

### Core flows
- Local setup from a fresh clone succeeds with documented commands.
- API starts and serves `/health` and `/api-docs`.
- Web app loads and can reach API in local dev.
- One end-to-end governance flow works: Inventory -> Risk -> Evidence -> Report.

### Non-goals
- Production infrastructure hardening.
- Multi-tenant enterprise SSO integrations.
- Full test coverage for all 80+ endpoints.

## 2) Definition of Done

- [ ] `npm run setup` succeeds on Node 20.9+ with Docker running.
- [ ] `npm run dev` starts API and web without manual file edits beyond `.env` secrets.
- [ ] One documented happy-path walkthrough is validated manually.
- [ ] API smoke tests (`/health`, one CRUD path) pass.
- [ ] README quick-start commands match reality.
- [ ] At least one automated API test and one web smoke check pass in CI/local.

## 3) Milestones and Issues

## Milestone 1: MVP runnable locally

### Issue M1-1: Enforce supported runtime and fast-fail on wrong Node version
Description: Prevent incompatible Node versions from causing opaque runtime errors.
Acceptance criteria:
- Root/app scripts fail with clear Node >= 20.9 requirement.
- `.nvmrc` matches supported Node version.
Dependencies/blockers: none.

### Issue M1-2: One-command local setup is idempotent
Description: Make setup script work on repeated runs and both compose command variants.
Acceptance criteria:
- Script supports `docker-compose` and `docker compose`.
- Script applies existing migrations without creating new ones.
- Script creates `apps/api/.env` from example when missing.
Dependencies/blockers: Docker available locally.

### Issue M1-3: Env sanity checks and startup validation
Description: Validate critical env variables early and fail with actionable messages.
Acceptance criteria:
- Missing `JWT_SECRET` and `DATABASE_URL` produce clear startup errors.
- README includes required env keys for local.
Dependencies/blockers: none.

## Milestone 2: MVP usable end-to-end

### Issue M2-1: Happy-path data flow walkthrough
Description: Validate one complete governance flow with seeded sample data.
Acceptance criteria:
- Documented steps produce one tool, one risk, one evidence item, one report.
- API responses are valid and visible in UI.
Dependencies/blockers: Milestone 1 complete.

### Issue M2-2: CSRF/auth usability smoke checks
Description: Ensure protected endpoints are usable from web app in default dev flow.
Acceptance criteria:
- Login obtains cookie/CSRF state correctly.
- At least one protected write action succeeds from UI.
Dependencies/blockers: M2-1.

### Issue M2-3: Minimal integration test script for core flow
Description: Add a script that verifies the MVP flow against local API.
Acceptance criteria:
- Script exits non-zero on failed step.
- Script verifies create/read for inventory and risk.
Dependencies/blockers: M2-1.

## Milestone 3: Polish + release

### Issue M3-1: MVP release notes and known limits
Description: Produce a concise release note for internal demo/release.
Acceptance criteria:
- Features, setup, and known limitations documented.
- Includes rollback and troubleshooting pointers.
Dependencies/blockers: Milestone 2 complete.

### Issue M3-2: Basic quality gate in CI
Description: Enforce one reliable build/test gate before merging.
Acceptance criteria:
- CI runs build + minimal tests on Node 20.
- Failing checks block merges.
Dependencies/blockers: M1-1 and M2-3.

### Issue M3-3: UI copy and empty-state polish for core pages
Description: Improve user clarity without changing architecture.
Acceptance criteria:
- Core pages have useful empty states and error text.
- No major layout regressions in desktop/mobile.
Dependencies/blockers: M2-1.
