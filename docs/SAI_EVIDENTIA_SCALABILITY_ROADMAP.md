# SAI + Evidentia — detailed roadmap, refactor options, and scalability

This document is the **how to proceed** guide for everything still open after the first governance bridge (see [EVIDENTIA_GOVERNANCE.md](./EVIDENTIA_GOVERNANCE.md) for current wiring). It prioritizes **refactored, scalable code** over one-off hacks.

For market and diligence framing, see [INVESTMENT_DILIGENCE_FULL_SPECTRUM.md](./INVESTMENT_DILIGENCE_FULL_SPECTRUM.md).

---

## 1. Guiding principles (do not violate)

1. **Two planes, one story**  
   - **SAI**: decisions, accountability, AI inventory, risk, policies, exceptions, “what we require.”  
   - **Evidentia**: evidence objects, collectors, review/approve mechanics, “what we can prove.”  
   Never duplicate Evidentia’s collector graph inside SAI; **orchestrate** it.

2. **Sync is a side effect, not the main path**  
   HTTP calls to Evidentia from the request thread are fine for MVP; production should **enqueue** work and retry with idempotency keys.

3. **Tenant safety first**  
   Every Evidentia call must carry a **tenant-scoped** credential (JWT `tid` / `tenant_id` aligned with SAI `companyId` mapping). No shared “god” token across customers in production.

4. **Secrets never in `IntegrationConnector.config` raw**  
   Use **references** (KMS/Secrets Manager key id) + runtime resolution in workers.

---

## 2. Where you are now (baseline)

Already in repo:

- Evidentia HTTP bridge + company toggle + UI (`/integrations/evidentia`).
- Evidence fields for **external id**, **review metadata**, **content hash**.
- **IntegrationConnector** registry (metadata; not yet secrets/OAuth).
- **Compliance snapshots** + **audit-package JSON** + **metrics** probe.
- Web auth cleanup toward **cookie + CSRF** (legacy token paths reduced).

Gaps called out explicitly below.

---

## 3. Phased plan (what to do in what order)

### Phase 0 — Hardening (1–2 weeks)

**Status:** completed — idempotent sync (`EvidentiaSyncState`), resilient HTTP (`evidentiaIntegrationFetch` timeout + circuit breaker), structured integration logs, legacy web `localStorage` token removed, and major `(prisma as any)` callsites eliminated with build/tests green.

**Goal:** production-safe defaults without new product surface.

| Item | Why | Concrete implementation |
|------|-----|---------------------------|
| **Idempotent Evidentia sync** | Retries must not duplicate evidence | Store `externalEvidenceId`; before create, search Evidentia by `references.saiEvidenceId` if API allows, or maintain a `EvidentiaSyncState` table `(companyId, saiEvidenceId, lastHash, status, lastErrorAt)`. |
| **Circuit breaker + timeouts** | Evidentia down must not stall SAI API | Wrap `fetch` in a small `ResilientHttpClient` (timeout 5–10s, max failures → open circuit, half-open probe). |
| **Structured integration logs** | Ops need causality | Log `companyId`, `saiEvidenceId`, `evidentiaId`, `durationMs`, `httpStatus` (no bearer token). |
| **Migrate remaining `localStorage` token** | Security + consistency | Grep `apps/web` for `token`; route everything through `api` + `credentials: 'include'`. |
| **Remove `(prisma as any)`** | Type safety = fewer prod bugs | Regenerate client after every schema change; fix enum mismatches at source (single `UserRole` / status enums). |

**Exit criteria:** CI green; Evidentia outage degrades gracefully (SAI writes succeed, sync retried or marked failed).

---

### Phase 1 — Tenant-scoped Evidentia credentials (2–3 weeks)

**Goal:** no global `EVIDENTIA_SERVICE_BEARER_TOKEN` for multi-tenant SaaS.

**Status:** started — added `CompanyEvidentiaLink` (tenant id + `secretRef`), token resolution via `EvidentiaTokenProvider`, and UI/API endpoints to configure per-company linkage.

**Recommended pattern (best balance of refactor vs scale):**

1. **Mapping table** `CompanyEvidentiaLink`  
   - `companyId` (unique)  
   - `evidentiaTenantId` (string UUID / slug Evidentia expects)  
   - `authMode`: `OAUTH_CLIENT_CREDENTIALS` | `STATIC_JWT_REF` | `M2M_KEY_REF`  
   - `secretRef` (string pointer to AWS/GCP secret name, **not** the secret)  
   - `tokenExpiresAt`, `rotatedAt`

2. **Token service** `EvidentiaTokenProvider`  
   - Resolves `secretRef` → short-lived JWT or client-credentials token.  
   - Caches in memory **per process** with TTL; Redis optional for multi-instance cache coherence.

3. **Admin UI**  
   - “Connect Evidentia” wizard: paste tenant id + upload service account / client id+secret → stored as secret ref only.

**Refactor option (cleaner domain):** move all Evidentia code under `apps/api/src/integrations/evidentia/` (client, mapper, token provider, sync worker interface) instead of flat `services/`.

**Exit criteria:** two SAI companies can point at two Evidentia tenants without env collision.

---

### Phase 2 — Async jobs and backpressure (3–5 weeks)

**Goal:** collectors, bulk sync, and large audit packages do not block API workers.

#### Option A — **BullMQ + Redis** (recommended for Node-first teams)

- **Pros:** mature, retries, delayed jobs, concurrency per queue, UI tools (Bull Board).  
- **Cons:** Redis HA required in prod; another moving part.

**Sketch:** queues `evidentia-sync`, `connector-run`, `audit-package-build`. API enqueues `{ companyId, evidenceId, idempotencyKey }`. Worker process(es) run as separate ECS service or separate Node entrypoint `apps/api/src/workers/index.ts`.

#### Option B — **PostgreSQL `pgmq` / Graphile Worker`**

- **Pros:** one less infra (DB is source of truth).  
- **Cons:** DB becomes queue hotspot; needs tuning for high write volume.

#### Option C — **Temporal / Step Functions**

- **Pros:** best for long orchestrations (multi-step approvals across systems).  
- **Cons:** heaviest operationally for a small team.

**Recommendation:** start **A (BullMQ)** when daily sync volume > ~10k events or p95 API latency regresses.

**Refactor:** introduce `packages/job-contracts` (Zod schemas for job payloads) shared by API and worker to avoid drift.

**Exit criteria:** `POST /evidence` returns <300ms p95 while sync backlog drains in background.

---

### Phase 3 — Connector platform (4–8 weeks)

**Goal:** “GitHub / AWS / IdP” as first-class plugins, not ad-hoc scripts.

**Architecture (scalable):**

```
integrations/
  contracts/          # ConnectorCapability, HealthCheck, OAuthConfig
  registry.ts         # type → factory
  runners/
    github.runner.ts
    aws-cloudtrail.runner.ts
```

**Per connector:**

1. **OAuth app** (where applicable) — store refresh token encrypted; rotate.  
2. **Incremental sync** — cursor (`since`, `etag`, `checkpoint`) in `IntegrationConnector.config` **non-secret** + `IntegrationConnectorState` table for opaque cursors if needed.  
3. **Normalizer** — map raw events → Evidentia “collected evidence” DTO (or SAI Evidence + push). Prefer **Evidentia** as sink for raw operational proof; SAI holds **governance decision** links.

**Scalability:** run connectors in **worker pool** with per-tenant concurrency caps (fair queuing).

**Exit criteria:** at least **GitHub** + **one cloud audit source** running on a schedule with visible last sync + error in UI.

---

### Phase 4 — Enterprise identity and org model (6–12 weeks)

| Capability | Implementation suggestion |
|------------|---------------------------|
| **SCIM 2.0** (`/scim/v2/Users`, `/Groups`) | New router behind feature flag; map SCIM groups → SAI roles; use service principal auth separate from user JWT. Consider **scim2-parse** patterns + strong ETag + idempotent creates. |
| **Org hierarchy** | `OrganizationalUnit` (tree), `User.ouId`, scope controls/evidence visibility. Migrate `companyId` filters to `(companyId, ouId?)`. |
| **SoD rules** | Declarative rules engine: e.g. “same user cannot APPROVE evidence they SUBMITTED” — evaluate in `EvidenceService` / Evidentia callback, not scattered `if`s. Store rules per `companyId` with versioning. |

**Exit criteria:** enterprise pilot checklist (SSO + SCIM + SoD) demoable.

---

## 4. Refactoring options (code quality vs delivery speed)

### 4.1 Backend layering (recommended evolution)

**Today:** controllers → services → Prisma (good for MVP).

**Target (modular monolith):**

```
domain/
  evidence/
    evidence.entity.ts       # pure types + invariants
    evidence.repository.ts   # interface
    evidence.service.ts      # use-cases
infra/
  prisma/
    evidence.repository.prisma.ts
integrations/
  evidentia/
```

**Rule:** domain services **must not** import Express types. Controllers stay thin.

**When to split microservices:** only if (a) separate deploy cadence is required, or (b) CPU-heavy workers need different autoscaling than API. Until then, **workers as separate processes** inside same repo is enough.

### 4.2 API surface

- Keep **`/api/v1`** as canonical; deprecate duplicate `/api/*` mounts with sunset headers in docs.  
- Version **integration** payloads under `/api/v1/integrations/...` only.

### 4.3 Frontend

- Centralize data loading in **hooks** (`useEvidence`, `useIntegrations`) instead of per-page `loadData` duplication.  
- Prefer **React Query** for caching, retries, and stale-while-revalidate (scales UX without extra backend load).

---

## 5. Scalability checklist (infrastructure + data)

| Layer | Tactic |
|-------|--------|
| **API** | Stateless instances behind ALB; session in cookie only; horizontal scale. |
| **DB** | Indexes on `(companyId, …)` for all tenant queries; avoid N+1 (`include` judiciously); consider read replica for reporting. |
| **Cache** | Redis for token cache + rate limit counters (per-tenant). |
| **Writes** | Outbox pattern: write SAI row + outbox event in one transaction; worker consumes outbox → Evidentia (at-least-once → idempotent consumer). |
| **Observability** | OpenTelemetry traces spanning SAI → Evidentia (W3C traceparent on outbound `fetch`). |
| **Limits** | Per-tenant daily sync quota; bulk push capped with continuation tokens. |

---

## 6. Security implementation details (high value, often skipped)

1. **mTLS or private networking** between SAI API and Evidentia in prod (VPC peering / mesh).  
2. **Webhook ingress** (future): verify signatures + replay protection (nonce store).  
3. **Audit log append-only**: DB constraints + no `UPDATE` on audit rows; export WORM to object storage for regulated clients.  
4. **Pen test / SOC2**: process + this roadmap = sales enablement; not code alone.

---

## 7. Suggested sprint breakdown (next 8 weeks)

| Week | Focus | Deliverable |
|------|--------|-------------|
| 1 | Phase 0 | Resilient HTTP client, sync idempotency table, grep-clean web auth |
| 2 | Phase 0 | Prisma `any` removal sweep; integration structured logs |
| 3–4 | Phase 1 | `CompanyEvidentiaLink` + token provider + admin connect flow |
| 5–6 | Phase 2 | BullMQ worker + outbox + move Evidentia sync off request thread |
| 7–8 | Phase 3 (start) | GitHub connector MVP + connector UI status |

Revisit priorities after week 4 based on **which buyer** (mid-market SaaS vs on-prem enterprise) is primary.

---

## 8. Definition of “done” for scalability claims

You can honestly say “scales to mid-market multi-tenant” when:

- [ ] API p95 stable under Evidentia slowdown (async + circuit breaker).  
- [ ] No global cross-tenant secrets for Evidentia.  
- [ ] Workers scale independently; queue depth monitored.  
- [ ] DB queries are indexed and paginated; heavy reports use snapshots or async exports.  
- [ ] Tracing + SLO dashboards exist for the integration path.

---

## 9. Related docs

- [EVIDENTIA_GOVERNANCE.md](./EVIDENTIA_GOVERNANCE.md) — current env + endpoints.  
- [STRUCTURE.md](./STRUCTURE.md) — repo layout; extend with `integrations/` and `workers/` when Phase 2 lands.  
- [INVESTMENT_DILIGENCE_FULL_SPECTRUM.md](./INVESTMENT_DILIGENCE_FULL_SPECTRUM.md) — product gaps and competitive framing.
