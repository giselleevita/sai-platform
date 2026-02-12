# Quick Reference - MVP Smoke Test

## Prerequisites

```bash
# 1) Start local stack
npm run setup

# 2) Start app servers
npm run dev
```

## Run the MVP Flow

```bash
# In a second terminal
npm run test:mvp
```

This script validates the core local MVP flow end-to-end:

1. Signup user
2. Create AI tool (inventory)
3. Create risk
4. Create policy + control
5. Create evidence
6. Generate risk report

## Run CSRF/Auth Smoke

```bash
npm run test:csrf
```

This script verifies CSRF protection behavior explicitly:

1. Protected write without CSRF header returns `401`.
2. Protected write with CSRF header returns `201`.

## Expected Result

- Command exits with code `0`
- Output includes `✅ Flow complete` (for MVP flow)
- Output includes `CSRF/auth smoke test passed` (for CSRF flow)

## Common Failures

- `Invalid CSRF token`
  - Run the flow only through `npm run test:mvp` (it manages cookie + CSRF state automatically).
  - Run `npm run test:csrf` to verify expected failure/success behavior explicitly.
- `connect ECONNREFUSED`
  - API is not running on `http://localhost:3001`.
- Prisma/DB errors
  - Ensure Docker is running and rerun `npm run setup`.
