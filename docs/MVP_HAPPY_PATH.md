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

## Run

```bash
npm run setup
npm run dev

# In a second terminal
npm run test:mvp
```

## Expected Output

- Script exits with status `0`
- Output includes `✅ Flow complete`
- Output prints created IDs for tool/risk/evidence

## Troubleshooting

- `Invalid CSRF token`:
  - Ensure you use the script end-to-end (it stores cookies + CSRF automatically).
- `ECONNREFUSED` on API:
  - Verify API is running on `http://localhost:3001`.
- DB errors:
  - Check Postgres container and rerun `npm run setup`.
