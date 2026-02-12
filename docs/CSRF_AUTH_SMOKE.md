# CSRF/Auth Smoke Test

This test validates cookie-session auth + CSRF enforcement on protected write endpoints.

## Run

```bash
npm run test:csrf
```

## What It Verifies

1. Signup establishes authenticated cookie session.
2. `POST /api/inventory` **without** `X-CSRF-Token` returns `401`.
3. `POST /api/inventory` **with** `X-CSRF-Token` returns `201` and succeeds.

## Expected Result

- Script exits with code `0`
- Output includes `CSRF/auth smoke test passed`

## Notes

- Requires API running on `http://localhost:3001`.
- Uses temporary cookies and a fresh test user each run.
