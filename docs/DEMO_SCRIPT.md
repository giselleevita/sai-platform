## SAI Demo Script (Seeded Tenant)

Use the demo tenant data seeded in Postgres.

### Login
- Email: `demo@sai.com`
- Password: `demo123`
- API health: http://localhost:3001/health
- Frontend: http://localhost:3000

### Flow to show (AI → Risk → Decision → Compliance)
1) Go to `/inventory`
   - Show 5 demo AI tools with mixed risk: High, Critical, Medium, Low, High.
2) Open “GenAI Copilot”
   - Risk: High, score 82
   - Decision: Accepted with expiry (owner: Maya Chen, Management)
   - Policies: AI Usage Policy, High-Risk Approval, Data Handling (PII)
   - Enforcement checks visible (management approval, DPA, critical decision rules)
3) Open “ImageGen Pro”
   - Risk: Critical, score 91
   - Decision: Rejected (no DPA, high sensitivity)
4) Open “DataInsights LLM”
   - Risk: Medium, score 64
   - Decision: Mitigate (monitoring, review date)
5) Open “VoiceBot Assist”
   - Risk: Low, score 32
   - Decision: Accepted (low risk, logging enabled)
6) Open “AutoClassifier”
   - Risk: High, score 78
   - Decision: Pending (decision required before production)

### Compliance snapshot
- Go to `/compliance`
- Shows immutable, time-based snapshot:
  - % compliant AI tools
  - High-risk unresolved
  - Missing decisions
  - Overdue reviews
- Lists for high-risk unresolved, missing decisions, overdue reviews.
- Export note: snapshots are immutable and exportable.

### Pricing (Phase 0)
- Config and calculator in `packages/shared-types/src/pricing.ts`
- API quote endpoint: `POST /api/pricing/quote`
  - Body: `{ tier: "mid-market" | "enterprise", aiTools: number, frameworks: string[], advancedGovernance: boolean }`

### Homepage (Phase 1)
- Visit `/` for the new SAI homepage targeting CISO/Compliance buyers with governance flow CTA.

### Talking points
- “We govern every AI decision with accountability and audit-ready proof.”
- “High-risk AI requires management approval; no DPA escalates risk; critical AI demands a decision.”
- “Compliance snapshot answers ‘Are we compliant right now?’ with immutable, time-based data.”
- “Pricing scales by AI risk surface, not per-user seats; auditors/read-only are free.”
