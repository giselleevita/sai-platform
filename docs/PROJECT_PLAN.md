# SAI Platform - Enterprise Readiness Project Plan

## Project Goal

Make SAI sellable to real enterprise buyers by delivering:
- ✅ Working governance workflows (not placeholder pages)
- ✅ Full RBAC enforcement
- ✅ Evidence coverage + expiry + auditor-ready views
- ✅ Compliance dashboard + gap analysis + snapshots
- ✅ Audit logs search/export

## Non-Goals (for now)
- ❌ No AI/ML
- ❌ No custom report builder
- ❌ No enterprise integrations (SSO/SIEM/Slack) until Phase 4
- ❌ No redesign of UI theme system

---

## Phase 0 — Hardening Baseline (Must do first)

### 0.1 RBAC Enforcement Everywhere (Backend)

**Requirements:**
- Implement a permission matrix (roles → permissions)
- Replace inconsistent `requireRoles` usage with `requirePermission(Permission.X)` middleware
- Audit every route: Inventory, Governance, Risks, Evidence, Incidents, Audit Logs, Reporting
- Default deny: all endpoints require explicit permission

**Deliverables:**
- Permission enum (e.g. TOOL_READ, TOOL_WRITE, CONTROL_APPROVE, EVIDENCE_APPROVE, AUDITLOG_READ, REPORT_EXPORT, etc.)
- `rolePermissions: Record<UserRole, Permission[]>`
- Middleware `requirePermission()` and `requirePermissionsAny()`/`All()`
- Unit tests per endpoint group verifying 401/403 behavior

**Acceptance Criteria:**
- Every protected route returns:
  - 401 if unauthenticated
  - 403 if authenticated but missing permission
- A role's abilities match the permission matrix
- Frontend hides restricted routes + buttons

**Commit Plan:**
1. Add Permission enum + mapping
2. Add middleware + tests
3. Apply to all routes (one module per commit)

---

## Phase 1 — Make Backend Features Usable (UI + Workflows)

### 1.1 Governance UI (Policies, Controls, Procedures, Regulations)

**Backend:**
- Confirm endpoints exist for CRUD + mapping
- Add missing endpoints if needed:
  - `POST /controls/:id/owner`
  - `POST /controls/:id/approve`
  - `POST /controls/:id/retire`
  - `GET /controls/:id/history`

**Frontend:**
- Implement real pages (replace placeholders):
  - `/governance/policies` - List, create, edit, delete
  - `/governance/controls` - List, create, edit, lifecycle, owner assignment, change history
  - `/governance/procedures` - List + create/edit
  - `/governance/regulations` - List + create/edit, map regulation → controls

**Acceptance Criteria:**
- All CRUD works end-to-end
- Controls have lifecycle actions with RBAC gating
- History view shows: who changed what, when
- Regulation mapping persists and displays correctly

### 1.2 Risk Management UI (Risk Register + Decisions)

**Backend:**
- Ensure endpoints exist: Risks CRUD, Risk ↔ control mapping, Decision log create/read
- Add missing fields: `approvedBy`, `approvedAt`, `rationale` (required), optional `expiresAt`

**Frontend:**
- Implement `/risk/register` with table, create/edit, detail page with decisions timeline, sign-off action, control mapping

**Acceptance Criteria:**
- Risks are visible and editable
- Decision logging works with required rationale
- Management sign-off is enforced via RBAC
- Control mapping works and is visible

### 1.3 Evidence UI (Upload, Expiry, Coverage)

**Backend:**
- Add evidence upload/attach endpoints
- Evidence status workflow: MISSING → SUBMITTED → APPROVED → EXPIRED
- Evidence validity: `validFrom`, `validTo` OR `reviewIntervalDays` + computed `nextReviewAt`
- Evidence coverage endpoint: `GET /evidence/coverage?regulationId=...`

**Frontend:**
- Implement `/evidence` list with status filters, upload workflow, control linking, approve/reject actions
- Implement `/evidence/coverage` with coverage % summary, missing/expired list, export CSV

**Acceptance Criteria:**
- Evidence upload works (files stored + referenced)
- Evidence approval changes status and logs event
- Evidence can be linked to controls
- Coverage report accurately reflects missing/expired evidence
- Validity windows cause automatic "EXPIRED" based on time

### 1.4 Incidents UI (Lifecycle, Owners, Post-incident review)

**Backend:**
- Ensure endpoints exist for lifecycle transitions
- Add: `ownerId`, `dueAt`, `rootCause`, `lessonsLearned`, `controlGaps[]`

**Frontend:**
- Implement `/incidents` list + create, detail page with lifecycle actions, owner assignment, review form

**Acceptance Criteria:**
- Lifecycle actions work and are audited
- Due date visible and sortable
- Post-incident review captured and immutable after review

---

## Phase 2 — Compliance Outcomes (Revenue Features)

### 2.1 Compliance Dashboard + Gap Analysis

**Backend:**
- Implement ComplianceSnapshot generation job (daily snapshot per tenant)
- APIs: `GET /compliance/summary`, `GET /compliance/gaps`, `GET /compliance/snapshots?from=&to=`

**Frontend:**
- Implement `/compliance` with overall status, gaps list, snapshot timeline

**Acceptance Criteria:**
- "Are we compliant?" answerable from one page
- Snapshots exist for prior days and are queryable
- Gaps are actionable (link to control/evidence/risk)

### 2.2 Audit Log UI + Export

**Backend:**
- `GET /audit-log?entityType=&entityId=&from=&to=&actorId=`
- Export: `GET /audit-log/export.csv`, `GET /audit-log/export.json`

**Frontend:**
- `/audit` query UI with filters, export buttons (CSV/JSON)

**Acceptance Criteria:**
- Filters work and don't leak cross-tenant data
- Export matches current filters

---

## Phase 3 — Conversion Accelerators

### 3.1 Auditor Mode (Read-only Portal)
- Create `/auditor/*` routes
- Add admin flow to generate time-limited auditor links (token)

### 3.2 Audit Packages (One-click Export)
- `GET /audit-package?framework=...`
- Produces ZIP with: evidence files, evidence certificates (hashes), audit log export, compliance snapshot summary

---

## Engineering Rules (Required)

1. **Tenant isolation** enforced at DB + service layers
2. **Every transition** writes an audit log entry
3. **All date-based states** (expired, overdue) must be computed consistently
4. **Integration tests** for:
   - RBAC (401/403)
   - Coverage computations
   - Snapshot generation
   - Export filtering

---

## Current Status

- ✅ Project plan created
- 🚧 Phase 0.1 - RBAC Enforcement (In Progress)
