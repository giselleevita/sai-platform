# EU AI Act — feature mapping

SAI Platform is a reference implementation, not a certified compliance product (see
the [README](../README.md) and [MVP release notes](RELEASE_NOTES_MVP.md) for what is
and is not implemented). This document maps existing platform features to the
obligations they are *relevant to* in Regulation (EU) 2024/1689 (the AI Act), so a
reviewer can see the connection without either side overstating it.

An organisation's actual compliance depends on its own risk classification,
processes, and legal review — this mapping only says "this feature produces evidence
that is useful for that article," not "this feature satisfies that article."

| AI Act obligation | What it requires (summary) | Platform feature | What it actually produces |
|---|---|---|---|
| **Art. 9 — Risk management system** | A continuous, iterative risk-management process across the AI system's lifecycle: identify, estimate, evaluate, and mitigate risks. | AI Tool Inventory + Risk Management module | Deterministic, versioned risk scoring (`RISK_MODEL_VERSION` stamped per score), likelihood/impact analysis, accept/defer/reject decisions with sign-off records, and score history that survives model changes. |
| **Art. 12 — Record-keeping** | Automatic logging of events over the system's lifetime, to a level enabling traceability of its functioning. | Audit Logging | Searchable, exportable activity records and a platform-wide activity feed covering governance actions (tool registration, risk decisions, control changes, evidence updates). |
| **Art. 14 — Human oversight** | Measures enabling natural persons to oversee the AI system's operation, including the ability to decide not to use it or to intervene. | Governance & Compliance workflow, Risk Management sign-off | Risk decisions (accept/defer/reject) are explicit, attributable actions by a named user, not automatic outcomes of the scoring engine. The scoring engine informs the decision; a person makes it. |
| **Art. 15 — Accuracy, robustness, cybersecurity** | Appropriate levels of accuracy, resilience against errors/faults, and security against unauthorized access. | Risk scoring design + platform security controls | Scoring is explicitly *not* a model — it is a deterministic, versioned function over documented factors, so its behaviour is reproducible and explainable rather than opaque. Separately, RBAC, company-scoped data isolation, input validation, and rate limiting address system-level (not model-level) robustness and access control. |
| **NIS2 (incident reporting obligations)** | Timely detection, handling, and reporting of security incidents. | Incident Tracking | Full incident lifecycle management with severity classification and reporting-deadline tracking. |

## Explicit non-claims

- SAI Platform does not perform the AI Act's **risk-tier classification** of a given
  AI system (prohibited / high-risk / limited / minimal) — that determination is a
  legal and organisational judgment, not something this codebase decides.
- It does not implement **conformity assessment**, **CE marking**, or **notified-body**
  workflows — those apply to providers of high-risk AI systems and are out of scope
  for a governance/evidence tool used by a deployer.
- "Evidence coverage and expiry tracking" (Governance & Compliance) tracks whether an
  organisation *has* produced required evidence and whether it is stale — it does not
  independently verify that the evidence is correct or sufficient.
- Test coverage is incomplete across the full API and UI surface (see
  [RELEASE_NOTES_MVP.md](RELEASE_NOTES_MVP.md)); features listed above should be
  reviewed against that document before being relied on.

## Reviewer path

1. Read [HOW_IT_WORKS.md](HOW_IT_WORKS.md) for the platform overview.
2. Run the [Quick Start](../README.md#quick-start) and populate sample data.
3. Walk through one risk decision end to end (create a tool → see its score →
   accept/defer/reject with sign-off) and one audit-log query, to see the Art. 9/12/14
   evidence trail this table describes actually being produced, not just documented.
