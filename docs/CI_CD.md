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

Runtime:
- Node version comes from `.nvmrc`
- npm dependency caching enabled via `actions/setup-node`

## Why This Gate

This is the minimum reliable gate for MVP merges:
- catches compile/build regressions
- catches baseline automated test failures
- keeps runtime consistent with local setup

## Security Checks

- **Pipeline file**: `.github/workflows/security.yml`
- **Jobs**:
  - `Dependency Audit`: fails on high/critical production dependency vulnerabilities (`npm audit --omit=dev --audit-level=high`)
  - `Secret Scan`: runs `gitleaks` on every PR/push to `main`

## Secure SDLC Automation

- **CodeQL** (`.github/workflows/codeql.yml`)
  - Static analysis on push/PR to `main`
  - Weekly scheduled scan
- **Dependabot** (`.github/dependabot.yml`)
  - Weekly npm dependency update PRs
  - Weekly GitHub Actions update PRs

## Merge Blocking Requirement

To make failing checks block merges, GitHub branch protection or rulesets must be enabled for `main` and require the status check from this workflow.

On the current repository plan, branch protection/rulesets API access returns `403` (feature unavailable), so enforcement must be configured in repository settings after plan upgrade or moving to a public repository.
