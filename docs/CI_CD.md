## CI/CD Design (GitHub Actions)

- **Pipeline file**: `.github/workflows/ci.yml`
- **Workflow name**: `Quality Gate`
- **Triggers**:
  - `pull_request` to `main`
  - `push` to `main`

### Quality Gate Job

Job name: `Build + Test (Node 20)`

Steps:
1. `npm ci`
2. `npm run check:node`
3. `npm run build`
4. `npm run test`
5. `npm --workspace @sai/api run test:security`

Runtime:
- Node version comes from `.nvmrc`
- npm dependency caching enabled via `actions/setup-node`

## Why This Gate

This is the minimum reliable gate for MVP merges:
- catches compile/build regressions
- catches baseline automated test failures
- keeps runtime consistent with local setup
- enforces high coverage on the CSRF middleware path
  - enforced via `scripts/check-security-coverage.cjs` with hard thresholds

## Security Checks

- **Pipeline file**: `.github/workflows/security.yml`
- **Jobs**:
  - `Dependency Audit`: fails on high/critical production dependency vulnerabilities (`npm audit --omit=dev --audit-level=high`)
  - `Secret Scan`: runs `gitleaks` on every PR/push to `main`
- **Pipeline file**: `.github/workflows/dependency-review.yml`
- **Job**:
  - `Dependency Review (PR)`: fails PRs introducing high/critical vulnerable dependencies

## Secure SDLC Automation

- **CodeQL** (`.github/workflows/codeql.yml`)
  - Static analysis on push/PR to `main`
  - Weekly scheduled scan
  - Runs in non-upload mode unless GitHub code scanning is enabled in repository settings
- **Dependabot** (`.github/dependabot.yml`)
  - Weekly npm dependency update PRs
  - Weekly GitHub Actions update PRs

## Security Governance Files

- **Security policy**: `SECURITY.md`
  - Private vulnerability reporting via GitHub Security Advisories
  - Response/triage/remediation target timelines
- **Ownership**: `.github/CODEOWNERS`
  - Default owner coverage for all repository paths

## Merge Blocking Requirement

To make failing checks block merges, GitHub branch protection or rulesets must be enabled for `main` and require the status check from this workflow.

On the current repository plan, branch protection/rulesets API access returns `403` (feature unavailable), so enforcement must be configured in repository settings after plan upgrade or moving to a public repository.
