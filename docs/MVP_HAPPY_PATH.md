# MVP Happy Path (Local)

This is the minimum end-to-end validation for the local MVP:

- Signup
- Create AI tool (Inventory)
- Create risk
- Create governance policy + control
- Create evidence
- Generate risk report

## Prerequisites

- Node.js `>=20.9.0`
- Docker running
- Local DB and migrations applied
- API running on `http://localhost:3001`

## Run API Flow (Automated)

```bash
npm run setup
npm run dev

# In a second terminal
npm run test:mvp
```

## Run CSRF/Auth Checks (Automated)

```bash
npm run test:csrf
```

## UI Validation (Manual/Browser Smoke)

Use this quick web check to validate UI + protected writes:

1. Open `http://localhost:3000/auth/login` and sign in.
2. Navigate to `http://localhost:3000/inventory/add`.
3. Fill required fields and submit `Add Tool`.
4. Verify request `POST /api/inventory` returns `201` in browser network tab.

Reference validation (2026-02-12):
- `POST /api/auth/login` -> `200`
- `POST /api/inventory` -> `201`
- `GET /api/inventory` -> `200`

## Expected Output

- `npm run test:mvp` exits `0` and prints `✅ Flow complete`
- `npm run test:csrf` exits `0` and prints `CSRF/auth smoke test passed`
- UI smoke shows successful protected write (`POST /api/inventory` status `201`)

## Troubleshooting

- `Invalid CSRF token`:
  - Ensure you use the scripts end-to-end (cookie + CSRF handling is automatic).
  - Run `npm run test:csrf` to isolate CSRF behavior.
- `ECONNREFUSED` on API:
  - Verify API is running on `http://localhost:3001`.
- DB errors:
  - Check Postgres container and rerun `npm run setup`.
