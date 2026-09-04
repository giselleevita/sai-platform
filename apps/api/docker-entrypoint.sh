#!/bin/sh
# Bring the database to the schema this image expects before serving anything.
#
# Hosts on free tiers rarely give you a shell, so a deployment that needs
# someone to run migrations by hand is a deployment that starts broken.
# Migrations are idempotent, and so is the seed, which is why both are safe to
# run on every boot.
set -e

echo "[entrypoint] applying migrations"
npx prisma migrate deploy

if [ "${SEED_ON_START}" = "true" ]; then
  echo "[entrypoint] seeding demo data"
  node dist/seed.js
fi

echo "[entrypoint] starting API"
exec node dist/main.js
