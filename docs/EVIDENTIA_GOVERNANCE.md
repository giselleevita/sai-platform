# SAI governs Evidentia

SAI stays the **governance plane** (controls, risk decisions, AI inventory). **Evidentia** remains the **evidence plane** (immutable-style evidence objects, submit/review/approve flows, collectors).

## How it works

1. **Configuration (API env)**  
   - `EVIDENTIA_EVIDENCE_BASE_URL` — base URL of Evidentia `evidence-service` (e.g. `http://localhost:8080`).  
   - `EVIDENTIA_SERVICE_BEARER_TOKEN` — a JWT Evidentia accepts (must include `tid` or `tenant_id` per Evidentia’s `EvidenceController`).

2. **Per-tenant toggle (SAI DB)**  
   - `Company.evidentiaSyncEnabled` — Management/Admin can enable from the UI (`/integrations/evidentia`).  
   - When enabled, creating or updating **SAI Evidence** triggers a best-effort sync to Evidentia (create → submit for review; approve when SAI status is `APPROVED`).

3. **Manual batch**  
   - `POST /api/integrations/evidentia/push` — pushes all evidence for the company (or `{ "evidenceId": "..." }` for one).

4. **Compliance snapshots**  
   - `POST /api/governance/compliance-snapshots` — stores a `ComplianceSnapshot` row with counts for audit trends.

5. **Audit package**  
   - `GET /api/reports/audit-package` — JSON manifest (evidence, controls, policies, risks, snapshots, recent audit log).

## Security notes

- Treat `EVIDENTIA_SERVICE_BEARER_TOKEN` as a **secret** (Secrets Manager in production).  
- Do **not** store long-lived third-party secrets in `IntegrationConnector.config` without encryption; that table is for **non-secret** connector metadata.
