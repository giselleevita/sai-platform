# Migration history baseline — 2026-09-03

## What was wrong

`prisma migrate deploy` failed on any genuinely fresh database:

```
Applying migration `20260114130000_add_soft_deletes`
Error: P3018
Database error: relation "Risk" does not exist
```

The `add_soft_deletes` migration ran `ALTER TABLE "Risk" ADD COLUMN "deletedAt" ...`,
but no migration in the checked-in history ever ran `CREATE TABLE "Risk"` — the
`20260109093803_init` migration only created `User`, `Company`, `AITool`, and
`RiskScore`. Auditing the full history against `schema.prisma` found this wasn't
an isolated gap: **22 of the 41 models** (`Risk`, `Evidence`, `Incident`, `Control`,
`Policy`, `Vendor`, `Webhook`, `AuditLog`, and 15 more) had no `CREATE TABLE`
anywhere in `prisma/migrations/`. The migration folder had stopped tracking the
schema at some point, most likely because changes were applied to a live
database with `prisma db push` rather than `prisma migrate dev`.

This only worked in practice because the actual databases in use (local dev,
staging, Neon) already had the full, current schema from being `db push`-ed
directly — `migrate deploy` was never exercised against a database that didn't
already have every table. Anyone standing up a genuinely new environment
(a new hire, CI with a fresh Postgres service, disaster recovery) would hit
this immediately.

## What changed

The 18 fragmented migrations were replaced with a single baseline migration,
[`20260903120000_baseline`](../apps/api/prisma/migrations/20260903120000_baseline/migration.sql),
generated directly from `schema.prisma` (`prisma migrate diff --from-empty
--to-schema-datamodel`) and verified:

- `prisma migrate deploy` now succeeds end-to-end on a fresh Postgres 15
  database (tested locally in Docker).
- `prisma migrate diff` between the resulting database and `schema.prisma`
  reports **no difference** — the baseline is byte-for-byte equivalent to the
  current schema.
- The full Jest suite (28 suites / 65 tests) passes against a database created
  purely from this one migration.

No application code changed. This only rewrites `prisma/migrations/`.

## What you need to do once, for each existing database

Any database that already has the current schema (your Neon instance, most
likely, since the app has been working) does **not** need the baseline
migration's SQL run against it — the tables already exist. It only needs to be
told that this migration is already satisfied, so `migrate deploy` doesn't try
to re-run `CREATE TABLE` on tables that are already there:

```bash
# Point DATABASE_URL at the environment in question, then:
npx prisma migrate resolve --applied 20260903120000_baseline
```

This is a metadata-only operation — it writes one row to the internal
`_prisma_migrations` tracking table and touches no application data or
schema. Run it once against each real environment (Neon prod, any staging DB)
before the next `migrate deploy` against that environment. I did not run this
myself against your Neon database — it uses live credentials from `.env` that
I didn't want to act against without you seeing this first.

If a database somehow does *not* yet have the current schema, running
`prisma migrate deploy` against it (without the `resolve` step) will apply the
baseline migration and create everything from scratch, same as the fresh-DB
test above.
