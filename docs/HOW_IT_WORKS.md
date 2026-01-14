# 🚀 How SAI Platform Works

## Overview

SAI Platform is a **Secure AI Integration SaaS Platform** that helps organizations manage, assess, and monitor AI tools used in their business. It provides risk scoring, compliance tracking, and policy management.

---

## 🎯 What the SAI Platform Must Deliver

### 1. Core Mission (Non-Negotiable)
SAI exists to give management and regulators provable control over security, risk, and compliance.

If SAI cannot prove governance decisions, accountability, and follow-through, it fails.

### 2. Governance and Control Management (Foundation)
SAI defines how the organization is supposed to behave.

Deliverables:
- Central registry of policies, controls, procedures, and regulatory obligations (e.g. NIS2 articles)
- Clear ownership: control owner, approver, reviewer
- Control lifecycle: Draft -> Active -> Under Review -> Retired
- Change history (who changed what, when, why)

Why this matters: Without this, compliance is interpretation-based, not enforceable.

### 3. Risk Management and Decision Traceability
SAI must show why decisions were made, not just what exists.

Deliverables:
- Risk register: description, likelihood x impact, owner, mitigation controls
- Risk to control mapping
- Decision log: accepted risks, deferred risks, rejected mitigations
- Management sign-off tracking

NIS2 relevance: NIS2 requires management accountability; this is where it lives.

### 4. Evidence Governance (via Evidentia Integration)
SAI does not store raw proof casually, it governs it.

Deliverables:
- Control to evidence linkage
- Evidence coverage status: Missing, Submitted, Approved, Expired
- Evidence validity windows
- Auditor-ready view (show proof for a specific control)

Key point: SAI orchestrates trust; Evidentia enforces integrity.

### 5. Incident and Crisis Governance (NIS2 Critical)
SAI must prove the organization can detect, respond, and learn.

Deliverables:
- Incident lifecycle: Detected -> Classified -> Escalated -> Resolved -> Reviewed
- Severity classification
- Reporting deadlines (e.g. 24h / 72h)
- Responsibility and escalation tracking
- Post-incident review: root cause, control gaps, follow-up actions

This answers the regulator question: What happens when things go wrong?

### 6. Accountability and Role Enforcement (Zero Ambiguity)
SAI must make it impossible to hide behind "not my responsibility".

Deliverables:
- Role-based access control: Management, Admin, Auditor, Operator
- Permission-based actions: who can approve, lock, escalate
- Explicit responsibility assignments

Important: RBAC is not a technical feature, it is legal protection.

### 7. Audit Readiness and Reporting (Management View)
SAI must answer instantly:
- Are we compliant?
- Where are the gaps?
- Who owns the gaps?
- What is overdue?
- What can an auditor verify today?

Deliverables:
- Compliance status dashboards
- Gap analysis reports
- Evidence completeness reports
- Exportable audit packages
- Time-based compliance snapshots

If it takes weeks to prepare for an audit, the platform failed.

### 8. Performance and Scalability (Where It Actually Counts)
Performance guarantees (examples):
- Control and evidence lookup: <300 ms (p95)
- Dashboard load: <2 seconds

Supports:
- 100k+ evidence items per tenant
- Thousands of controls
- Concurrent auditors during peak reviews

Audit logs must be append-only, non-blocking, and immutable.

Performance here equals trust under pressure.

### 9. Integration and Extensibility
SAI must assume it is not alone.

Deliverables:
- API-first architecture
- External evidence ingestion
- IAM / SSO integration
- SIEM / monitoring hooks
- Ticketing / task system integration

A closed platform dies fast in compliance environments.

### 10. Explicit Non-Goals (Maturity)
SAI should not:
- Replace operational security tools
- Perform vulnerability scanning
- Act as a SIEM
- Store ungoverned documents
- Make compliance decisions automatically

Its role is governance, not execution.

### One-Sentence Summary
SAI delivers provable governance by defining controls, enforcing accountability, linking risks to evidence, and keeping organizations continuously audit-ready under NIS2.

---

## 🏗️ Architecture

### Monorepo Structure
```
sai-platform/
├── apps/
│   ├── web/          # Next.js frontend (React)
│   └── api/          # Express.js backend (Node.js)
├── packages/
│   ├── shared-types/     # TypeScript types
│   └── risk-scoring/     # Risk calculation engine
└── services/         # Future microservices
```

### Technology Stack
- **Frontend**: Next.js 16, React, TypeScript, Tailwind CSS
- **Backend**: Node.js, Express, TypeScript
- **Database**: PostgreSQL (via Prisma ORM)
- **Authentication**: JWT tokens
- **Build System**: Turborepo (monorepo)

---

## 🔐 Authentication Flow

### 1. Signup
```
User fills form → Backend creates:
  - User account (with hashed password)
  - Company record
  - Default role assignment (Management)
  - JWT token generated
  → Token stored in localStorage
  → Redirect to dashboard
```

### 2. Login
```
User enters credentials → Backend verifies:
  - Email exists
  - Password matches hash
  → JWT token generated
  → Token stored in localStorage
  → Redirect to dashboard
```

### 3. Protected Routes
```
Every API request includes:
  Authorization: Bearer <token>
  → Backend verifies token
  → Extracts user & company ID
  → Returns company-specific data
```

### 4. Token Lifecycle
```
Access token expires → Refresh token issued
  → Silent refresh on app load or 401
  → Revocation supported on logout or admin action
  → Optional HTTP-only cookie storage
```

---

## 📊 Risk Scoring System

### How Risk Scores Are Calculated

The platform uses a **risk scoring algorithm** that evaluates multiple factors:

#### Factors Considered:
1. **Data Types** (0-40 points)
   - PII (Personally Identifiable Information): +15
   - Financial: +15
   - IP (Intellectual Property): +10
   - Proprietary: +10
   - Public: +0

2. **User Count** (0-20 points)
   - 1-10 users: +5
   - 11-50 users: +10
   - 51-200 users: +15
   - 200+ users: +20

3. **Usage Frequency** (0-15 points)
   - Daily: +15
   - Weekly: +8
   - Rarely: +3

4. **Security Controls** (0-25 points, subtracted)
   - Each control reduces risk: -5 points each
   - Controls: MFA, Encryption, DLP, AuditLog, DataResidency, ContractReview

5. **Additional Factors**
   - Has DPA (Data Processing Agreement): -5
   - Notes with risk keywords: +5-10

#### Risk Levels:
- **Critical**: 70-100 points
- **High**: 50-69 points
- **Medium**: 30-49 points
- **Low**: 0-29 points

### Example Calculation:
```
Tool: ChatGPT
- Data Types: PII (+15) + Financial (+15) = 30
- Users: 100 users = +15
- Frequency: Daily = +15
- Controls: MFA (-5) + Encryption (-5) = -10
- Has DPA: -5
Total: 30 + 15 + 15 - 10 - 5 = 45 points → "Medium" risk
```

---

## 🗄️ Data Flow

### Adding a Tool
```
1. User fills form on /inventory/add
2. Frontend sends POST /api/inventory
3. Backend:
   - Validates input
   - Calculates risk score (using @sai/risk-scoring)
   - Creates AITool record
   - Creates RiskScore history record
   - Returns tool with risk score
4. Frontend displays tool in inventory
```

### Viewing Dashboard
```
1. User visits /dashboard
2. Frontend requests:
   - GET /api/inventory (all tools)
   - GET /api/inventory/summary (risk summary)
3. Backend:
   - Filters by companyId (security!)
   - Calculates summary statistics
   - Returns data
4. Frontend displays:
   - Risk summary cards
   - Tools table
   - Charts/graphs
```

---

## 🔒 Security Features

### 1. Company Isolation (Multi-Tenant)
- Every user belongs to a company
- All data filtered by `companyId`
- Users can only see their company's data
- API enforces this at every endpoint

### 2. Password Security
- Passwords hashed with bcrypt (10 rounds)
- Never stored in plain text
- Password strength requirements enforced

### 3. JWT Authentication
- Tokens expire after 7 days
- Contains: user ID, email, company ID, role
- Verified on every API request
- Refresh tokens for silent re-authentication
- Token revocation on logout or admin action
- HTTP-only cookies option for improved XSS protection

### 4. Input Validation
- Email format validation
- Password strength checks
- Tool data validation (categories, data types, etc.)
- Prevents SQL injection, XSS attacks

### 5. Role-Based Access Control (RBAC)
- Roles: Management, Admin, Auditor, Operator
- Permission matrix enforced on API routes
- UI gates based on role claims

#### RBAC Matrix (Example)
| Action | Management | Admin | Operator | Auditor |
| --- | --- | --- | --- | --- |
| Manage users & roles | ✅ | ✅ | ❌ | ❌ |
| Create/update tools | ✅ | ✅ | ✅ | ❌ |
| Delete tools | ✅ | ✅ | ❌ | ❌ |
| Approve exceptions | ✅ | ✅ | ❌ | ❌ |
| View reports | ✅ | ✅ | ✅ | ✅ |

### 6. Audit Logging
- Tracks create/update/delete actions on tools and policies
- Records actor, timestamp, and before/after values
- Immutable log export for compliance review

#### Audit Log Example
```json
{
  "id": "aud_123",
  "companyId": "comp_1",
  "actorId": "user_42",
  "action": "tool.update",
  "targetType": "AITool",
  "targetId": "tool_9",
  "changes": {
    "dataTypes": { "from": ["Public"], "to": ["PII", "Financial"] },
    "controls": { "from": ["MFA"], "to": ["MFA", "DLP"] }
  },
  "createdAt": "2025-02-12T10:15:00Z"
}
```

---

## 📱 User Interface

### Pages Available:

1. **Home** (`/`)
   - Landing page
   - Redirects to dashboard if logged in

2. **Login** (`/auth/login`)
   - Sign in with credentials
   - Demo credentials button

3. **Signup** (`/auth/signup`)
   - Create new account
   - Creates user + company

4. **Dashboard** (`/dashboard`)
   - Risk summary cards
   - Tools table
   - Quick actions

5. **Inventory** (`/inventory`)
   - List all AI tools
   - Filter by risk level
   - Sort by various criteria

6. **Add Tool** (`/inventory/add`)
   - Form to add new AI tool
   - Auto-calculates risk score

7. **Tool Detail** (`/inventory/[id]`)
   - View tool details
   - Edit tool
   - Delete tool
   - View risk history

8. **Governance** (`/governance`)
   - Central registry links for policies, controls, procedures, regulations

9. **Policies** (`/policies`)
   - View compliance policies
   - Download templates

10. **Controls** (`/controls`)
   - Manage control lifecycle and ownership

11. **Procedures** (`/procedures`)
   - Document control execution steps

12. **Regulations** (`/regulations`)
   - Track NIS2/GDPR obligations

13. **Risk Register** (`/risks`)
   - Risk register and decision traceability

14. **Evidence** (`/evidence`)
   - Evidence coverage status and validity windows

15. **Incidents** (`/incidents`)
   - Incident lifecycle and escalation tracking

16. **Audit Log** (`/audit`)
   - Append-only governance activity log

17. **Compliance** (`/compliance`)
   - Compliance tracking dashboard

18. **Reports** (`/reports`)
    - Generate reports
    - Export data
    - **Coming Soon:**
      - Custom report builder
      - Scheduled report generation
      - PDF export with charts and graphs
      - Risk trend analysis
      - Compliance gap analysis
      - Executive summaries

---

## 🔄 API Endpoints

### Authentication
- `POST /api/auth/signup` - Create account
- `POST /api/auth/login` - Sign in
- `GET /api/auth/me` - Get current user
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Revoke refresh token

### Inventory
- `GET /api/inventory` - List all tools (company-filtered)
- `GET /api/inventory?risk=High&sort=score&limit=50&cursor=...` - Filter, sort, paginate
- `POST /api/inventory` - Create new tool
- `GET /api/inventory/:id` - Get tool details
- `PATCH /api/inventory/:id` - Update tool
- `DELETE /api/inventory/:id` - Delete tool
- `GET /api/inventory/summary` - Get risk summary
- `GET /api/inventory/export/csv` - Export CSV

### Governance
- `GET /api/governance/policies` - List policies
- `POST /api/governance/policies` - Create policy
- `PATCH /api/governance/policies/:id` - Update policy
- `DELETE /api/governance/policies/:id` - Delete policy
- `GET /api/governance/controls` - List controls
- `POST /api/governance/controls` - Create control
- `PATCH /api/governance/controls/:id` - Update control
- `DELETE /api/governance/controls/:id` - Delete control
- `GET /api/governance/procedures` - List procedures
- `POST /api/governance/procedures` - Create procedure
- `PATCH /api/governance/procedures/:id` - Update procedure
- `DELETE /api/governance/procedures/:id` - Delete procedure
- `GET /api/governance/regulations` - List regulations
- `POST /api/governance/regulations` - Create regulation
- `PATCH /api/governance/regulations/:id` - Update regulation
- `DELETE /api/governance/regulations/:id` - Delete regulation

### Risks
- `GET /api/risks` - List risks
- `POST /api/risks` - Create risk
- `PATCH /api/risks/:id` - Update risk
- `DELETE /api/risks/:id` - Delete risk
- `POST /api/risks/:id/decisions` - Add management decision

### Evidence
- `GET /api/evidence` - List evidence
- `POST /api/evidence` - Add evidence record
- `PATCH /api/evidence/:id` - Update evidence status
- `DELETE /api/evidence/:id` - Delete evidence record

### Incidents
- `GET /api/incidents` - List incidents
- `POST /api/incidents` - Create incident
- `PATCH /api/incidents/:id` - Update incident
- `DELETE /api/incidents/:id` - Delete incident

### Exceptions
- `POST /api/exceptions` - Create risk acceptance request
- `GET /api/exceptions` - List exceptions
- `PATCH /api/exceptions/:id` - Approve/deny exception

### Audit
- `GET /api/audit` - Query audit log

### Integrations
- `POST /api/integrations/slack` - Connect Slack
- `POST /api/integrations/siem` - Configure SIEM export

### Vendors
- `GET /api/vendors` - List vendors
- `POST /api/vendors` - Create vendor
- `PATCH /api/vendors/:id` - Update vendor
- `DELETE /api/vendors/:id` - Delete vendor

---

## 🧮 Risk Scoring Package

Located in `packages/risk-scoring/`, this package:

1. **Takes input**: Tool data (name, category, dataTypes, users, frequency, controls, notes)
2. **Calculates score**: Based on algorithm
3. **Returns**:
   - `score`: Number (0-100)
   - `level`: "Low" | "Medium" | "High" | "Critical"
   - `factors`: Breakdown of calculation
   - `recommendations`: Suggested actions

### Risk Scoring Notes
- Keyword risk detection supports a managed keyword list with weights
- Each score stores a full factor breakdown for explainability
- DPA and data residency flags adjust score and recommended controls

#### Keyword List (Example)
| Keyword | Weight |
| --- | --- |
| customer data | +5 |
| ssn | +10 |
| bank account | +10 |
| payment card | +10 |
| healthcare | +8 |
| source code | +8 |
| contract | +6 |
| internal only | +3 |

#### Policy Rule Example
```json
{
  "name": "High Risk Requires DLP + Contract Review",
  "appliesToRisk": ["High", "Critical"],
  "controlsRequired": ["DLP", "ContractReview"],
  "blockUntilMet": true
}
```

### Usage:
```typescript
import { calculateRiskScore } from '@sai/risk-scoring';

const result = calculateRiskScore({
  name: 'ChatGPT',
  category: 'LLM',
  dataTypes: ['PII', 'Financial'],
  users: 100,
  frequency: 'Daily',
  controls: ['MFA', 'Encryption'],
  notes: 'Used for customer support'
});

// Returns:
// {
//   score: 45,
//   level: 'Medium',
//   factors: { ... },
//   recommendations: [ ... ]
// }
```

---

## 🗃️ Database Schema

### Key Models:

**User**
- id, email, password (hashed), name, role, companyId

**Company**
- id, name, email, industry, country

**AITool**
- id, companyId, name, category, vendor, dataTypes, users, frequency
- controls, riskScore, riskLevel, hasDPA, dataResidency

**RiskScore**
- id, companyId, toolId, score, level, factors (JSON), recommendations
- Tracks risk score history over time

**Policy**
- id, companyId, name, controlsRequired, appliesToRisk

**Exception**
- id, companyId, toolId, requestedBy, approvedBy, status, expiresAt

**AuditLog**
- id, companyId, actorId, action, targetType, targetId, changes (JSON), createdAt

**Vendor**
- id, companyId, name, region, subprocessors (JSON), securityReviewStatus

---

## 🔍 Key Features

### 1. **Automatic Risk Calculation**
- Every tool gets a risk score automatically
- Score recalculated when tool is updated
- History tracked for trend analysis

### 2. **Company Isolation**
- Multi-tenant architecture
- Each company's data is completely separate
- Enforced at database query level

### 3. **Real-time Updates**
- Risk scores update immediately
- Dashboard shows current status
- No manual calculation needed

### 4. **Compliance Ready**
- Policy templates included
- DPA tracking
- Data residency tracking
- Audit trail (risk score history)

### 5. **Policy Engine**
- Map risk levels to required controls (e.g., High -> MFA + DLP)
- Block approval until required controls are met

### 6. **Exception Workflow**
- Risk acceptance requests with approver and expiration date
- Review history stored per tool

### 7. **Analytics and Trends**
- Risk score trends over time
- Vendor and category risk heatmaps

### 8. **Integrations**
- SSO (SAML/OIDC)
- SIEM and ticketing exports
- Slack/Teams notifications for high-risk changes

### 9. **Compliance Mapping**
- Map tool controls to ISO/SOC2/GDPR requirements
- Evidence export for audits

### 10. **Data Flow Mapping**
- Capture where data originates, where it is processed, and where it is stored
- Retention and deletion policies per tool

### 11. **Vendor Risk Management**
- Vendor profiles with ownership, hosting region, and subprocessors
- Security questionnaires and review status tracking

### 12. **Usage Telemetry (Optional)**
- Track actual usage vs. declared usage
- Alert on unexpected spikes or risky usage patterns

### 13. **Change Management**
- Track critical changes (data types, users, controls)
- Require re-approval if risk crosses thresholds

---

## 🚀 Getting Started

### 1. Start the Platform
```bash
# Start database
docker-compose up -d postgres

# Start services
npm run dev
```

### 2. Create Account
- Go to http://localhost:3000/auth/signup
- Or use demo credentials on login page

### 3. Add Your First Tool
- Go to Dashboard → "Add Tool"
- Fill in tool information
- Risk score calculated automatically

### 4. Monitor Risks
- View dashboard for overview
- Check inventory for details
- Review risk levels and recommendations

---

## 📈 Use Cases

1. **IT Security Teams**
   - Track all AI tools in use
   - Identify high-risk tools
   - Ensure compliance

2. **Compliance Officers**
   - Monitor data processing
   - Track DPAs
   - Generate reports

3. **Management**
   - Risk overview dashboard
   - Tool usage statistics
   - Compliance status

---

## 🔮 Future Enhancements

- Real-time notifications for high-risk tools
- Automated compliance checks
- Integration with security tools
- **Advanced Reporting & Analytics** (Coming Soon):
  - Custom report builder with drag-and-drop interface
  - Scheduled report generation (daily, weekly, monthly)
  - PDF export with charts, graphs, and executive summaries
  - Risk trend analysis over time
  - Compliance gap analysis reports
  - Executive summaries for management
- Team collaboration features
- API for third-party integrations
- Data flow mapping and retention tracking
- Vendor security questionnaires and due diligence
- Automated control verification
- Risk model tuning with historical outcomes

---

**The platform is designed to be simple to use but powerful enough for enterprise needs!**
