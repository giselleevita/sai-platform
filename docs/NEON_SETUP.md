## Neon Database Setup

1) Create a Neon project and database.
2) Create a dedicated role/user for the app with a strong password.
3) Grab the connection string and ensure it includes `sslmode=require`, e.g.:
   - `postgresql://APP_USER:APP_PASS@your-neon-host.neon.tech/sai_db?sslmode=require`
4) Set `DATABASE_URL` to that value in:
   - Secrets Manager/SSM for staging/prod
   - `.env` locally if you want to skip Docker Postgres
5) Run migrations against Neon:
   - `cd apps/api`
   - `DATABASE_URL="postgresql://...sslmode=require" npx prisma migrate deploy`
6) (Optional) For local dev without Neon, you can still use Docker Postgres via `docker compose up -d` and a local `DATABASE_URL`.

Notes:
- Prisma 5.22.0 is pinned; keep Neon on Postgres 15+.
- For CI, keep the ephemeral Postgres service unless you want CI to hit Neon directly. If you point CI to Neon, use a staging branch/DB, never production.
