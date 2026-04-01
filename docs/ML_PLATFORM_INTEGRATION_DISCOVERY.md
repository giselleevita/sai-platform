# ML Platform Integration Discovery

Date: 2026-04-01
Status: Draft v1
Owners: API + Platform

## Scope

This discovery document defines the first production-ready integration surface for:
- MLflow
- AWS SageMaker
- Google Vertex AI

## Integration Goals

- Keep provider onboarding consistent behind one API contract.
- Capture enough metadata for governance, audit, and incident response.
- Support incremental rollout from metadata-only connectors to active telemetry sync.

## Provider Capability Snapshot

| Provider | Identity Key | Region Field | Model Identifier | Notes |
|---|---|---|---|---|
| MLflow | tracking URI + workspace token | optional | model name + version | Works for self-hosted and managed MLflow |
| SageMaker | account ID + IAM role ARN | required | endpoint name and/or model package ARN | IAM scoped to read-only first phase |
| Vertex AI | project ID + service account | required | model resource name | Should support multiple regions |

## Data We Need Per Integration

- Provider type (MLFLOW, SAGEMAKER, VERTEX_AI, OTHER)
- Display name
- Status
- Connection configuration object
- Last successful sync timestamp
- Last error metadata
- Freeform notes for implementation runbook references

## Rollout Plan

1. Phase 1 (current): registry + CRUD + validation schema.
2. Phase 2: connection test endpoint per provider.
3. Phase 3: periodic sync jobs for model inventory and drift signals.

## Validation Signal

- API accepts and persists all three primary providers.
- Invalid provider payloads are rejected by schema validation.
- Configuration object remains provider-agnostic while preserving typed keys in docs.
