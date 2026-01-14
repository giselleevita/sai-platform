## CI/CD Design (GitHub Actions)

- **Pipeline file**: `.github/workflows/ci.yml`
- **Triggers**: `push` to `main` and all `pull_request`.
- **Services**: Postgres 15 service container for Prisma validation.
- **Steps**:
  1) `npm ci`
  2) `npx prisma generate --schema apps/api/prisma/schema.prisma`
  3) `npm run lint --workspace web`
  4) `npm run build --workspace @sai/api`
  5) `npm run build --workspace web`
  6) `npx prisma migrate diff --from-schema-datamodel apps/api/prisma/schema.prisma --to-empty --script`

- **Env defaults**: `DATABASE_URL` uses the Postgres service; `NEXT_PUBLIC_API_URL`/`NEXT_PUBLIC_APP_URL` set to local defaults for build parity.

### Deployment hooks (recommended next)
- Add a second workflow for deployments that:
  - Builds/pushes images from `apps/api/Dockerfile` and `apps/web/Dockerfile` to GHCR/ECR.
  - Runs `prisma migrate deploy` against staging/prod before updating services.
  - Deploys API to ECS Fargate and uploads Next.js static output to S3+CloudFront (or triggers Vercel deploy).
