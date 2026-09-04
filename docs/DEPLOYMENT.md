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

## Demo deployment: free, and awake

`render.yaml` deploys the demo from this repository as a single service built
from `Dockerfile.demo`.

1. Create a free Neon project and copy its connection string. Neon rather than
   Render's own free Postgres, which expires thirty days after creation and
   would take the demo with it.
2. In Render: New, then Blueprint, then point it at this repository.
3. Paste the Neon string when prompted for `DATABASE_URL`.
4. Point a free uptime monitor (cron-job.org, UptimeRobot) at
   `https://<your-service>.onrender.com/api/health` every ten minutes.

Step four is what makes it fast. A free Render service sleeps after fifteen
minutes without traffic and takes about a minute to wake, which is a poor first
impression for a link on a CV. A free workspace gets 750 instance hours a
month, and a month is about 730 hours, so one service can stay awake
continuously but two cannot. That is why the API and the web app ship in one
container here even though the real topology is two services: it buys a demo
that is always warm, for nothing.

The health check path goes through the web app's proxy to the API, so a passing
check means both processes are alive rather than just the one holding the port.

### No shell, so the container does the work

Free plans give you no shell. The container applies migrations on boot and
seeds the demo tenant when `SEED_ON_START` is true. Both are idempotent, which
also makes a restart the reset.

### What is build-time

Next inlines `NEXT_PUBLIC_*` values and resolves rewrite destinations during
`next build`. Render turns service environment variables into Docker build
arguments, which is what makes the blueprint work without a second pass. Inside
the demo image the API is a sibling process, so the proxy target is fixed at
`http://localhost:3001` in the Dockerfile rather than configured per deploy.

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
