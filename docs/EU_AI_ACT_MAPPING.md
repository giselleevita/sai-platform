# SAI Platform — EU AI Act Control Mapping

## Purpose

Maps each SAI Platform capability to the specific EU AI Act article it satisfies. This is the reference document for every prospect conversation involving EU AI Act compliance.

## Mapping: SAI Feature → EU AI Act Article

### Annex III — High-Risk AI Systems

| SAI Feature                   | EU AI Act Article | Requirement                                                     | How SAI Satisfies                                                                  |
| ----------------------------- | ----------------- | --------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| **AI Tool Inventory**         | Art. 9(1)         | Risk management system shall be established                     | SAI maintains a living registry of all AI systems with risk classification         |
| **Risk Scoring Engine**       | Art. 9(2)(a)      | Identification and analysis of known/foreseeable risks          | Automated risk scoring with configurable rubrics per AI system                     |
| **Risk Assessment Dashboard** | Art. 9(2)(b)      | Estimation and evaluation of risks from intended use and misuse | Visual risk dashboard with trend tracking and threshold alerts                     |
| **Policy Rules Engine**       | Art. 9(4)         | Risk management measures ensuring residual risk is acceptable   | Policy-as-code enforcement with automated compliance checks                        |
| **Audit Trail Export**        | Art. 12           | Automatic recording of events (logs)                            | Immutable audit log with export to standard formats (JSON, CSV)                    |
| **Incident Tracking**         | Art. 62           | Reporting of serious incidents                                  | Built-in incident tracking with severity classification and notification workflows |
| **Evidence Collection**       | Art. 11           | Technical documentation                                         | Continuous evidence capture linked to each registered AI system                    |
| **Vendor Risk Module**        | Art. 28           | Obligations of deployers                                        | Third-party AI vendor risk assessment and monitoring                               |
| **RBAC + Access Control**     | Art. 9(4)(d)      | Human oversight measures                                        | Role-based access ensuring appropriate human review of AI decisions                |
| **ML Integration Hooks**      | Art. 15           | Accuracy, robustness and cybersecurity                          | Integration points for model monitoring, drift detection, and adversarial testing  |

### General-Purpose AI Models (GPAI)

| SAI Feature                | EU AI Act Article    | Requirement                               | How SAI Satisfies                                                                |
| -------------------------- | -------------------- | ----------------------------------------- | -------------------------------------------------------------------------------- |
| **AI System Registration** | Art. 49 + Annex VIII | Registration in EU database               | SAI registry tracks all GPAI deployments with metadata required for registration |
| **Risk Classification**    | Art. 6               | Classification rules for high-risk AI     | Automated classification workflow based on use-case and deployment context       |
| **Transparency Reporting** | Art. 13              | Transparency and provision of information | Report generation showing AI system capabilities, limitations, and intended use  |

## Compliance Workflow (End-to-End)

```
1. Register AI system in SAI Inventory
   └── Art. 49: EU database registration data captured

2. Run Risk Scoring
   └── Art. 9: Risk management system executed
   └── Art. 6: Classification as high-risk / limited-risk / minimal-risk

3. Apply Policy Rules
   └── Art. 9(4): Residual risk controls enforced
   └── Art. 14: Human oversight rules defined

4. Continuous Monitoring
   └── Art. 15: Accuracy/robustness monitoring via ML integrations
   └── Art. 72: Post-market monitoring system

5. Incident Response
   └── Art. 62: Serious incident reporting workflow

6. Audit Export
   └── Art. 12: Automatic event logging exported for regulators
   └── Art. 11: Technical documentation generated
```

## Gap Analysis (Features in Roadmap)

| EU AI Act Requirement                       | Status          | Notes                                                    |
| ------------------------------------------- | --------------- | -------------------------------------------------------- |
| Art. 10 — Data governance                   | Roadmap Q3 2026 | Dataset quality tracking for training data               |
| Art. 14 — Human oversight                   | Partial         | RBAC exists; explicit human-in-the-loop workflow planned |
| Art. 72 — Post-market monitoring            | Roadmap Q4 2026 | Automated drift detection integration                    |
| Annex IV — Technical documentation template | Roadmap Q2 2026 | Auto-generated Article 11 compliance document            |
