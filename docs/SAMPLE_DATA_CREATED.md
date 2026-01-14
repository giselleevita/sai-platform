# Sample Data Created for Test Account

## Account Details
- **Email**: test@sai.com
- **Password**: Password123
- **Role**: MANAGEMENT (full access)
- **Company**: Test Company

## Sample Data Summary

### 📦 AI Tools (5 items)
1. **ChatGPT Enterprise** (Medium Risk)
   - Category: LLM
   - Users: 150
   - Data Types: PII, Financial
   - Controls: MFA, Encryption, DLP, AuditLog
   - Has DPA: Yes
   - Data Residency: EU

2. **GitHub Copilot** (Medium Risk)
   - Category: CodeGen
   - Users: 85
   - Data Types: IP, Proprietary
   - Controls: MFA, Encryption, AuditLog
   - Has DPA: Yes

3. **Midjourney** (Low Risk)
   - Category: ImageGen
   - Users: 25
   - Data Types: Public
   - Controls: MFA
   - Has DPA: No

4. **Salesforce Einstein** (Medium Risk)
   - Category: Analytics
   - Users: 200
   - Data Types: PII, Financial, Proprietary
   - Controls: MFA, Encryption, DLP, AuditLog, DataResidency
   - Has DPA: Yes

5. **DeepL Translator** (Medium Risk)
   - Category: LLM
   - Users: 40
   - Data Types: PII
   - Controls: Encryption, DLP
   - Has DPA: Yes

### ⚠️ Risks (3 items)
1. **Data Leakage Risk - ChatGPT**
   - Likelihood: 4, Impact: 5
   - Category: Data Security

2. **Code IP Exposure - GitHub Copilot**
   - Likelihood: 3, Impact: 4
   - Category: Intellectual Property

3. **Vendor Lock-in - Salesforce**
   - Likelihood: 2, Impact: 4
   - Category: Business Continuity

### 📜 Policies (2 items)
1. **AI Usage Policy** (ACTIVE)
   - Governance policy for AI tool usage and approval

2. **Data Handling Policy** (ACTIVE)
   - Policy for handling PII and sensitive data in AI tools

### 🛡️ Controls (3 items)
1. **MFA Enforcement** (ACTIVE)
   - All AI tools must require MFA for access
   - Linked to: AI Usage Policy

2. **DPA Requirement** (ACTIVE)
   - All AI tools processing PII must have signed DPA
   - Linked to: Data Handling Policy

3. **Data Encryption** (ACTIVE)
   - All data in transit and at rest must be encrypted
   - Linked to: Data Handling Policy

### 📋 Evidence (2 items)
1. **MFA Audit Evidence**
   - Status: APPROVED
   - Valid: 2026-01-01 to 2026-12-31
   - Reference: MFA-Audit-2026.pdf

2. **DPA Evidence**
   - Status: APPROVED
   - Valid: 2026-01-01 to 2027-01-01
   - Reference: DPA-OpenAI-2026.pdf

### 🚨 Incidents (2 items)
1. **Unauthorized AI Tool Usage**
   - Severity: High
   - Status: CLASSIFIED
   - Detected: 2026-01-10

2. **Data Residency Violation**
   - Severity: Critical
   - Status: ESCALATED
   - Detected: 2026-01-12

### 🏢 Vendors (2 items)
1. **OpenAI**
   - Region: US/EU
   - Security Review: Approved

2. **Salesforce**
   - Region: Global
   - Security Review: Approved

### 📖 Regulations (2 items)
1. **GDPR - Article 25: Data Protection by Design**
2. **EU AI Act - Article 8: High-Risk AI Systems**

## What You Can Explore

### Dashboard (`/dashboard`)
- View risk summary across all AI tools
- See compliance status overview
- Quick access to high-risk items

### Inventory (`/inventory`)
- Browse all 5 AI tools
- View detailed risk assessments
- See governance profiles
- Export data to CSV

### Risks (`/risks`)
- View all 3 risk entries
- See risk scores and categories
- Add decision logs
- Track risk mitigation

### Governance (`/governance`)
- View policies and controls
- See control-to-policy mappings
- Track evidence coverage
- Review regulations

### Evidence (`/evidence`)
- View evidence records
- Check approval status
- Monitor expiry dates
- Track coverage gaps

### Incidents (`/incidents`)
- View incident reports
- Track incident lifecycle
- See severity levels
- Monitor resolution status

### Audit (`/audit`)
- View audit logs
- Filter by action type
- Export audit trails
- Track all system changes

### Vendors (`/vendors`)
- View vendor information
- Check security review status
- See subprocessors
- Track vendor compliance

## Next Steps

1. **Login** at http://localhost:3000/auth/login
   - Email: test@sai.com
   - Password: Password123

2. **Explore** the dashboard to see the overview

3. **Navigate** through different sections:
   - Inventory → See AI tools with risk scores
   - Risks → View risk register
   - Governance → See policies and controls
   - Evidence → Check compliance evidence
   - Incidents → Review security incidents

4. **Try Features**:
   - Add a new AI tool
   - Create a new risk
   - Add evidence to a control
   - Update incident status
   - Export data

## Data Script

The sample data was created using:
```bash
./scripts/populate-sample-data.sh
```

You can re-run this script anytime to reset the sample data.
