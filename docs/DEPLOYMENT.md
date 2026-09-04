## Deployment & Secrets Blueprint (AWS-first, Neon DB)

- **Target stack**: API on AWS ECS Fargate; Postgres on **Neon** (managed Postgres with SSL); optional Redis on ElastiCache; static Next.js build on S3 + CloudFront (or Vercel if preferred).
- **Secrets**: Store all secrets in AWS Secrets Manager (preferred) or SSM Parameter Store. Never commit `.env` files. Rotate `JWT_SECRET`, database credentials (Neon), and SMTP/API keys at least quarterly.
- **Images**: Build and publish OCI images to a private registry (GHCR or ECR). API image uses `apps/api/Dockerfile`; Web uses `apps/web/Dockerfile`.

### Environments
- **dev**: local Docker Compose (Postgres + Redis) with `.env` files.
- **staging**: Fargate service + staging RDS; secrets from Secrets Manager; CI deploys on merge to `main`.
- **prod**: Separate VPC/subnets, RDS with backups/retention, Secrets Manager, CloudFront CDN.

### Required environment variables
- API: `DATABASE_URL` (Neon connection string with `sslmode=require`), `JWT_SECRET`, `JWT_EXPIRES_IN`, `REFRESH_TOKEN_DAYS`, `FRONTEND_URL`, `LOG_LEVEL`, SMTP creds (for future notifications), `MFA_ISSUER` (defaults to `SAI Platform`).
- Web: `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_APP_URL` (for links), `NEXT_TELEMETRY_DISABLED=1`.

### Secret storage
- Store each secret as a separate entry (e.g., `/sai/prod/api/JWT_SECRET`). Grant the ECS task role `secretsmanager:GetSecretValue`.
- For staging/prod, disable `.env` files; inject secrets via task definitions or CI deploy steps.

### Database migrations
- Run `npx prisma migrate deploy` on release before starting the new API task (points to Neon).
- Enable point-in-time restore in Neon; create a branch or backup before migrations; verify `prisma migrate status` in CI.

### Health, logs, and metrics
- API exposes `GET /health` for liveness/readiness.
- Ship structured logs to CloudWatch (via task role) or Datadog. Set `LOG_LEVEL` per env.
- Add uptime checks (Route53/CloudWatch Synthetics) against `/health`.

### Minimal deploy runbook
1) Build & push images: `docker build -f apps/api/Dockerfile .` and `docker build -f apps/web/Dockerfile .`; push to GHCR/ECR.
2) Provision RDS + Secrets Manager entries; populate required secrets.
3) Create ECS service (Fargate) for API using the pushed image; wire Secrets Manager to env vars; add ALB listener on 443 → target group.
4) Run `prisma migrate deploy` as a one-off task (or CI job) before switching traffic.
5) Upload Next.js static build to S3 + CloudFront (or deploy web via Vercel using the same `NEXT_PUBLIC_API_URL`).
6) Verify `/health`, smoke-test auth/login, and run `tests/api/test-suite.sh` against staging.

---

## Demo deployment: free, and without a server

`render.yaml` deploys both services from this repository. Render reads it,
builds the two images and wires them to each other, so the only value it asks
for is the database connection string.

1. Create a free Neon project and copy its connection string. Neon is used
   rather than Render's own free Postgres, which expires thirty days after
   creation and takes the demo with it.
2. In Render: New, then Blueprint, then point it at this repository.
3. Paste the Neon string when prompted for `DATABASE_URL`.

That is the whole setup. The API container applies migrations and seeds the
demo tenant on every boot, both idempotent, because free plans give you no
shell and a deployment that needs someone to run migrations by hand is a
deployment that starts broken.

Render turns service environment variables into Docker build arguments, which
this repository depends on: Next bakes the API origin and every `NEXT_PUBLIC_*`
value into the build, so they must exist before the image is built. `API_ORIGIN`
is filled in from the API service's own hostname, and the config adds the scheme
when a host arrives without one.

**What free costs you.** A Render free service sleeps after fifteen minutes
without traffic and takes about a minute to wake, so the first visitor after a
quiet spell waits. Say so next to the link rather than letting someone assume
the app is broken. Neon's free compute also scales to zero and wakes in a second
or two. Neither has a card requirement for the demo sizes used here.

---

## Alternative: one host, Docker Compose

Everything the demo needs runs on a single small VM: Postgres, Redis, the API
and the web app. Verified end to end against `docker-compose.prod.yml`, from
image build through migrations, seeding and a working sign-in.

The database must be PostgreSQL. Prisma's datasource provider is `postgresql`
and Prisma has no Oracle connector, so Oracle Database would mean replacing the
data layer rather than changing a connection string. Oracle Cloud is still a
reasonable *host*: an Always Free ARM instance runs this stack comfortably.

```bash
# on the host, in a clone of this repository
cp .env.example .env   # then set the values below
docker compose -f docker-compose.prod.yml build
docker compose -f docker-compose.prod.yml up -d
docker compose -f docker-compose.prod.yml exec api npx prisma migrate deploy
docker compose -f docker-compose.prod.yml exec api npm run db:seed:prod
```

Required in `.env`:

| Variable | Notes |
|---|---|
| `JWT_SECRET` | The API refuses to start in production without a real value. |
| `PUBLIC_URL` | The origin the browser uses. Becomes `CORS_ORIGIN`. |
| `DEMO_USER_EMAIL`, `DEMO_USER_PASSWORD` | Read by the seed. |
| `NEXT_PUBLIC_DEMO_EMAIL`, `NEXT_PUBLIC_DEMO_PASSWORD` | Shown on the login page. Leave unset outside a demo and the credentials block disappears. |
| `API_ORIGIN` | Defaults to `http://api:3001`. |

### Three things that are build-time, not run-time

Next inlines `NEXT_PUBLIC_*` values and resolves rewrite destinations during
`next build`, writing them into `.next/routes-manifest.json`. Setting them only
in `environment:` changes nothing: the container keeps proxying to `localhost`,
which inside the web container is the web container itself. They are passed as
build arguments, and changing any of them needs `build`, not `restart`.

`turbo.json` declares `API_ORIGIN` and `NEXT_PUBLIC_*` as inputs to the build
task. Without that, turbo serves a cached build made with different values.

### Reset

The seed is idempotent, so a nightly reset is the same command again. To wipe
instead, remove the `sai_postgres_data` volume and re-run migrate and seed.
