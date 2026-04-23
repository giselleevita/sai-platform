# SAI Platform — Full-Spectrum Investment Diligence (repo-grounded)

Last reviewed: 2026-04-22  
Repository: `sai-platform/` (Next.js + Express + Prisma/Postgres, Turborepo)

This is **product + technical + execution diligence** grounded in the codebase currently in `~/Projects/sai-platform`.

## Executive take (business reality)

### Market thesis (what it is, who pays)
- **What it is**: AI governance system (inventory, risk scoring, policy/control registry, evidence tracking, incident tracking, audit log, exports/reports).
- **Who pays**: security/compliance leaders at regulated or audit-heavy orgs; secondarily IT governance / risk.
- **Primary budget**: GRC / compliance tooling, not “AI tooling”.

### Competitive reality (2026)
This category is crowded: established GRC suites (ServiceNow GRC, Archer, OneTrust, Drata/Vanta adjacent), plus newer AI governance vendors. Differentiation usually comes from:
- **Evidence automation + integrations** (connectors, ingestion, normalization, auditor workflows)
- **Enterprise identity & procurement fit** (SSO, SCIM, audit exports, data residency, tenant controls)
- **Trust posture** (security program, controls, SDLC, third-party assessments)

**SAI Platform today is a strong MVP / demoable prototype**, but it is not yet an enterprise-ready competitor *on its own* without significant work in integrations, lifecycle workflows, and hardening.

## Product scope vs “must-have” check (customer POV)

### What’s present (high-signal)
- **Inventory + risk scoring**: core CRUD + scoring package (`packages/risk-scoring`) with explainability payloads.
- **Governance objects**: policies, controls, procedures, regulations (Prisma models + API routes).
- **Evidence tracking**: evidence records linked to controls (internal module, not external evidence system).
- **Incidents**: incident lifecycle features exist.
- **Audit log**: action logging exists.
- **Exports/reports**: basic reporting flows exist.
- **Role model**: RBAC concept exists, permissions enforced in API routes.
- **Auth**: cookie-based auth path, refresh tokens, MFA primitives, and OIDC SSO flow are present.
- **CI**: build + minimal tests + a sprint-smoke job with Postgres + migration deploy.

### “Must-have” gaps to win deals (typical enterprise buyer)
These are the functions that usually decide vendor selection or time-to-close:

#### Evidence automation and integrations (largest gap)
- **Connectors**: no evidence collectors (GitHub, AWS, Okta, Google Workspace, Jira, etc.) surfaced as real integrations.
- **Evidence ingestion pipeline**: no normalized ingestion API with schema evolution, dedupe, provenance, integrity checks, retention rules, and reviewer workflows.
- **Audit packages**: export is present, but enterprise expects structured “audit package” generation with evidence bundles, immutable references, and traceability.

#### Governance workflows (second largest gap)
- **Approval workflows**: lifecycle states exist, but enterprise expects multi-step approvals, delegated approvals, separation-of-duties enforcement, attestations, and periodic reviews.
- **Tasking / remediation**: missing first-class tasks, SLAs, overdue tracking, and integration into ticketing.

#### Multi-tenant & enterprise org management
- **Org model**: company isolation exists, but enterprise expects org structures (departments, entities), cross-entity controls, and admin boundaries.
- **Provisioning**: missing SCIM, JIT provisioning policy, user lifecycle automation.

#### Reporting depth
- **Board-ready outputs**: “executive summary” exists, but enterprises want repeatable snapshots, trendlines, evidence completeness metrics, and defensible KPI definitions.
- **Framework mapping**: regulations/framework templates, control objectives, and mapping maturity are usually decisive.

#### Trust posture
- Missing evidence of: secure SDLC, threat model, pen test, SOC2/ISO program evidence, incident response runbooks, data retention policies, and privacy posture.

## Architecture review (what you can credibly scale)

### Current architecture
- **Web**: Next.js app router (`apps/web`)
- **API**: Express TypeScript (`apps/api`)
- **DB**: Postgres via Prisma
- **Monorepo**: Turbo workspaces, shared packages
- **CI**: GitHub Actions with Postgres service + `prisma migrate deploy`

### Strengths
- **Simple deployable unit**: one API, one web app, single Postgres — good for early customers.
- **Schema is fairly complete for MVP**: many governance entities exist; indexes exist on key dimensions.
- **CI includes migration + smoke**: unusually good for an early-stage repo.
- **Auth direction is “enterprise-shaped”**: refresh tokens, cookies, OIDC flow, MFA hooks.

### Architectural risks / debt (affects scalability + enterprise readiness)
- **Auth migration inconsistency in web**: multiple pages still check `localStorage.getItem('token')`, while newer flow uses cookies/CSRF. That creates broken UX risk and security confusion.
- **Prisma `any` workarounds**: multiple services use `(prisma as any)` which is a maintainability and correctness smell (schema/client mismatch). This slows safe iteration.
- **Monolith boundaries**: everything in one API will hit complexity once you add integrations, long-running collectors, async jobs, and audit-grade reporting.
- **Async processing**: evidence collection/report generation needs queues, job orchestration, and backpressure; current blueprint mentions Redis optional but no clear job system.
- **Data model sprawl risk**: lots of entities; without strict domain boundaries, it becomes hard to evolve and audit.

### Scalability assessment (pragmatic)
- **MVP scale**: fine (single tenant, low volume).
- **Mid-market**: feasible with careful indexing, pagination, and background jobs.
- **Enterprise**: needs:
  - background job system (queue + workers)
  - connector services (separate deploys)
  - audit-grade immutability patterns for logs/evidence references
  - robust tenancy boundaries (policy + technical controls)
  - reporting pipelines (precomputed snapshots, retention)

## Functional diligence by domain (what’s missing / not accounted for)

### 1) Evidence governance (core to “audit readiness”)
Current: evidence records exist with status/validity fields.  
Missing:
- evidence provenance model (source system, collection method, hashes, immutable references)
- reviewer workflow (review assignments, comments, rejections, remediation loop)
- retention/expiry automation
- attachments/object storage integration (S3) + scanning (malware) + content types
- evidence dedupe and canonicalization

### 2) Integrations (deal-maker)
Missing:
- connector catalog + OAuth app patterns
- secret management per tenant
- ingestion cadence and audit trails
- “pull vs push” modes (webhooks)
- sandbox mode for demos

### 3) Governance workflows
Missing:
- separation-of-duties enforcement beyond basic RBAC
- periodic review schedules (“control attestation every quarter”)
- policy exception workflows tied to evidence and expiry

### 4) Security/compliance readiness
Present: CI security gate mention; cookie auth path; rate limiting is advertised.  
Not fully accounted for / must verify or add:
- XSS posture (especially if legacy token flows remain)
- CSRF correctness on all mutating routes (looks partially enforced)
- audit log immutability guarantees (append-only constraints, WORM exports)
- secrets lifecycle and environment hygiene (docs exist; need enforcement)

### 5) Operability
Missing / unclear:
- structured metrics (p95 latencies, job queues, DB health)
- tenancy-level rate limits and quotas
- audit-ready logging retention strategy
- backup/restore runbook validation

## Competitive positioning recommendation (business + build)

### The “wedge” that can win
Pick one:
- **AI-tool inventory + risk scoring with decision traceability** (fast wedge)
- **Audit-ready evidence automation for AI usage** (harder wedge but stronger moat)

Right now, SAI looks closer to the first wedge. To compete, it must **either**:
- go deeper on AI governance (model cards, DPIAs, AI Act mapping, vendor/LLM usage telemetry), **or**
- integrate with an evidence automation engine (like Evidentia) to become “audit-ready” fast.

### Business decision: fuse vs integrate with Evidentia
Given the code reality, the best business/engineering path is:
- **Integrate** (SAI governs; Evidentia collects/normalizes evidence) rather than “fuse repos”.
- Unify UX + identity first; unify codebases only if on-prem single-SKU becomes a dominant requirement.

## Investment-grade risk register (high-signal)

### Product risk
- Without integrations/evidence automation, customers may treat SAI as “another tracker”.

### Technical delivery risk
- Migrating legacy token/localStorage paths in the web app is required to avoid security and UX inconsistencies.
- The `(prisma as any)` debt risks regressions and slows iteration.

### Go-to-market risk
- Selling into compliance without a trust program (SOC2/pen test/process evidence) is difficult.

## Recommended build plan (to become competitive)

### Phase A (2–4 weeks): make the MVP trustworthy
- Remove/finish legacy token flow in web; enforce cookie/CSRF everywhere.
- Replace Prisma `any` workarounds (fix client generation / schema alignment).
- Add “auditor workflow” basics: evidence review state + comments + assignments.

### Phase B (4–8 weeks): add the deal-maker
- Build “evidence connector” contract (pull/push) and ship 2–3 high-value connectors:
  - GitHub (repos, branch protection, audit logs)
  - Cloud provider (AWS CloudTrail summary)
  - IdP (Okta/Azure AD sign-in/audit events)

### Phase C (8–12 weeks): enterprise close features
- SSO hardening + SCIM
- audit package export
- compliance snapshots/trends
- background job system + worker deployment

## Bottom line (investment view)
**SAI Platform can compete as a credible early-stage product** if it chooses a sharp wedge and adds integrations + evidence automation. As-is, it’s most competitive as a **demoable governance MVP** rather than a full enterprise GRC replacement.

---

## Next: execution roadmap (refactor + scale)

For a **phased implementation plan**, Evidentia tenant credentials, async jobs, connector platform, SCIM/org/SoD, and refactoring options, see [SAI_EVIDENTIA_SCALABILITY_ROADMAP.md](./SAI_EVIDENTIA_SCALABILITY_ROADMAP.md).

