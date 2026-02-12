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

## Expected Result

- Command exits with code `0`
- Output includes `✅ Flow complete`
- Output prints created entity IDs

## Common Failures

- `Invalid CSRF token`
  - Run the flow only through `npm run test:mvp` (it manages cookie + CSRF state automatically).
- `connect ECONNREFUSED`
  - API is not running on `http://localhost:3001`.
- Prisma/DB errors
  - Ensure Docker is running and rerun `npm run setup`.
