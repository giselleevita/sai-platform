✅ How to Use This with Cursor

Create file:
docs/SAI_Sellability_Master_Spec.md

Paste everything below.

In Cursor Chat, run prompts in order:

Implement Phase 0 exactly as specified

Implement Phase 1 exactly as specified

Implement Phase 2 exactly as specified

Do not skip phases.

docs/SAI_Sellability_Master_Spec.md
Product

SAI Platform – AI Governance, Risk, and Compliance System

Goal

Make SAI enterprise-sellable by ensuring:

Clear value proposition for AI governance buyers

Defensible, regulation-aligned pricing

A homepage that converts CISOs & Compliance Heads

A product that visibly enforces accountability

🔴 Phase 0 — Pricing Model (Required Before Sales)
0.1 Pricing Model Definition (Authoritative)
Pricing Principles

Annual SaaS subscription

No per-user pricing

Pricing scales by AI risk surface

Auditors and read-only users are free

0.2 SAI Pricing Structure (Final)
1️⃣ Base Platform Subscription (Mandatory)

Includes:

AI inventory

Risk scoring engine

Governance workflows

Decision logging

Policy enforcement

Audit logging

Compliance snapshots

RBAC

Price

€12,000 / year (mid-market)

€25,000+ / year (enterprise baseline)

2️⃣ AI Tool Count Scaling

Included AI tools per year:

AI Tools	Cost
Up to 25	Included
26–100	+€4,000 / year
100+	Custom
3️⃣ Regulatory Framework Add-Ons

Charged per active framework:

EU AI Act

NIS2

ISO 27001 (AI scope)

SOC 2 (AI usage)

Price

€3,000 / framework / year

4️⃣ Advanced Governance Add-On (Optional)

Includes:

Policy enforcement rules

Mandatory management sign-off

Decision expiry & re-approval

Evidence handoff to Evidentia

Price

€4,000 / year

What Is Free (Always)

Auditors

Read-only users

Evidence exports

Compliance reports

Acceptance Criteria

Pricing is not per user

Pricing can be explained in < 60 seconds

Pricing aligns with AI risk exposure

Pricing supports €15k–€60k ARR deals

🔴 Phase 1 — SAI Homepage (Conversion Critical)
1.1 Homepage Objective

Convince a CISO / Head of Compliance that:

“This platform gives us control and accountability over AI usage.”

1.2 Homepage Structure (Strict)
Section 1 — Hero (Above the Fold)

Headline (H1)
“Govern every AI decision — with accountability, risk control, and audit-ready proof.”

Subheadline (H2)
SAI is an enterprise AI governance platform that helps organizations assess AI risk, enforce policies, and prove compliance with regulations like the EU AI Act and NIS2.

Primary CTA

Request demo

Secondary CTA

See governance flow

Visual (Right side)

Simple flow diagram:

AI Tool → Risk Score → Policy → Decision → Compliance Snapshot

❌ No dashboards
❌ No stock illustrations

Section 2 — Trust Strip

Display as horizontal strip:

Built for EU AI Act, NIS2, ISO 27001

Enterprise RBAC

Immutable audit trails

Designed for regulators and auditors

Section 3 — Problem Statement

Heading
“AI adoption without governance is a compliance risk.”

Bullets

AI tools are adopted without oversight

No consistent risk assessment

Decisions are undocumented

No ownership or accountability

Regulators ask questions you can’t answer

Section 4 — SAI Core Capabilities (4 Pillars)
🧠 AI Risk Assessment

Automated, explainable risk scoring

Data sensitivity, usage, controls

📜 Policy Enforcement

High-risk AI requires approval

Opinionated governance rules

No policy = escalation

👤 Decision Accountability

Accept / Mitigate / Reject

Owner, rationale, expiry

Full decision history

📊 Compliance Readiness

Real-time AI compliance status

High-risk AI overview

Point-in-time snapshots

Section 5 — How It Works

Register AI tool

Risk score calculated

Policy triggered

Decision logged

Compliance status updated

Section 6 — Who It’s For

Compliance Teams

Clear governance

Audit-ready documentation

Security Teams

Risk visibility

Policy enforcement

Management

Clear accountability

Board-level reporting

Section 7 — Differentiation Table
SAI Platform	Typical AI Usage
Documented decisions	Ad-hoc approvals
Risk-based governance	Tool sprawl
Policy enforcement	Best-effort rules
Compliance snapshots	Manual reporting
Section 8 — Final CTA

“AI governance is not optional. Be ready.”

Buttons:

Request demo

View governance flow

Homepage Acceptance Criteria

Value understood in < 60 seconds

Clear target audience

Clear regulatory relevance

No feature dumping

No marketing buzzwords

🔴 Phase 2 — Product Features That Make SAI Sellable
2.1 Mandatory UI Flows (Must Be Visible)
AI → Risk → Decision → Compliance

Each AI tool page must show:

Risk score (with factors)

Applicable policies

Decision status

Decision owner + rationale

Review / expiry date

2.2 Compliance Snapshot Page

Single page answering:

“Are we AI-compliant right now?”

Must include:

% compliant AI tools

High-risk unresolved tools

Missing decisions

Overdue reviews

Snapshots must be:

Immutable

Time-based

Exportable

2.3 Policy Enforcement (Opinionated)

Minimum rules:

High risk → management approval required

No DPA → risk escalated

Critical risk → decision mandatory

No custom rule builder in Phase 2.

2.4 RBAC & Separation of Duties

Enforce:

Tool owner ≠ approver

Approver ≠ auditor

All transitions logged

2.5 Demo Tenant

Create seeded demo:

5 AI tools

Mixed risk levels

At least 1 rejected AI

At least 1 accepted with expiry

Compliance snapshot populated

Cursor Prompts (Use These)
Prompt 1 — Pricing

“Implement pricing logic per docs/SAI_Sellability_Master_Spec.md Phase 0. Add internal pricing config and feature flags.”

Prompt 2 — Homepage

“Implement SAI homepage exactly per Phase 1. Do not add extra sections.”

Prompt 3 — Core Governance

“Implement Phase 2: AI risk → decision → compliance flows. Ensure UI visibly shows accountability.”

End of Spec
Final Guidance (Important)

If SAI:

Clearly shows who approved which AI and why

Can answer ‘are we compliant right now?’

Has pricing tied to AI risk

👉 it will sell.

If you want next, I can:

Turn pricing into Stripe / contract logic

Define feature flags per tier

Design SAI demo script

Split SAI vs Evidentia bundle pricing

Just say the word.
