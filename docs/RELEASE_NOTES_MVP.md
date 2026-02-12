# MVP Release Notes

Release date: 2026-02-12
Version: MVP 1.0

## Scope Delivered

- Local setup hardened for reproducibility (`npm run setup`, Node runtime checks).
- Core API + web app run path validated.
- Core governance flow validated end-to-end:
  - Inventory -> Risk -> Evidence -> Report.
- CSRF/cookie auth behavior validated for protected write endpoints.
- Baseline CI quality gate added (Node 20 build + tests).

## How to Run This MVP

```bash
npm install
npm run setup
npm run dev
```

Optional validation:

```bash
npm run test:mvp
npm run test:csrf
```

## Known Limitations

- Branch protection/ruleset enforcement for required checks is not enabled via API on current repo plan (`403`); manual settings enablement depends on plan capability.
- Web lint debt exists; CI gate currently targets build + minimal tests only.
- Test coverage is still minimal and does not fully cover all endpoints/pages.
- Docker is required for local database-backed setup.

## Rollback / Recovery

If a regression is introduced after this release:

1. Revert the merge commit in `main` via GitHub UI or `git revert <merge_commit_sha>`.
2. Re-run `npm run build` and `npm run test` to confirm recovery.
3. Validate runtime health:
   - `GET /health`
   - `npm run test:mvp`
4. If DB issues appear, restart local stack and re-apply migrations with `npm run setup`.

## Troubleshooting Pointers

- Setup/runtime issues: `docs/GETTING_STARTED.md`
- Common failures + fixes: `docs/TROUBLESHOOTING.md`
- CSRF/auth checks: `docs/CSRF_AUTH_SMOKE.md`
- MVP flow verification: `docs/MVP_HAPPY_PATH.md`
- CI gate behavior: `docs/CI_CD.md`
