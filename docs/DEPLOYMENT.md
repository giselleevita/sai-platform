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
