#!/usr/bin/env bash
# Full local sprint smoke: Postgres (Docker) → Prisma migrate → build API → run API → test:sprint → stop API.
# Does not stop Postgres (idempotent `docker compose up -d`); reuse with npm run dev.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_ROOT"

API_PID=""
cleanup() {
  if [[ -n "${API_PID}" ]] && kill -0 "${API_PID}" 2>/dev/null; then
    kill "${API_PID}" 2>/dev/null || true
    wait "${API_PID}" 2>/dev/null || true
  fi
}
trap cleanup EXIT

if ! command -v docker &>/dev/null; then
  echo "❌ Docker is not installed."
  exit 1
fi
if ! docker info &>/dev/null; then
  echo "❌ Docker is not running."
  exit 1
fi

if command -v docker-compose &>/dev/null; then
  COMPOSE_CMD=(docker-compose)
elif docker compose version &>/dev/null; then
  COMPOSE_CMD=(docker compose)
else
  echo "❌ Docker Compose is not available."
  exit 1
fi

export DATABASE_URL="${DATABASE_URL:-postgresql://sai_user:sai_password@localhost:5432/sai_db}"
export JWT_SECRET="${JWT_SECRET:-ci-local-sprint-smoke-jwt-secret-32b!!}"
export NODE_ENV="${NODE_ENV:-development}"
export PORT="${PORT:-3001}"

echo "==> Starting Postgres (${COMPOSE_CMD[*]} up -d postgres)"
"${COMPOSE_CMD[@]}" up -d postgres

echo "==> Waiting for database"
until "${COMPOSE_CMD[@]}" exec -T postgres pg_isready -U sai_user -d sai_db &>/dev/null; do
  sleep 2
done
echo "✅ Postgres is ready"

if curl -sf "http://127.0.0.1:${PORT}/health" &>/dev/null; then
  echo "❌ Something is already responding on http://127.0.0.1:${PORT}/health — free the port or set PORT."
  exit 1
fi

echo "==> npm run check:node"
npm run check:node

echo "==> npm run build:api"
npm run build:api

echo "==> prisma migrate deploy"
(
  cd apps/api
  npx prisma migrate deploy
)

LOG_FILE="${TMPDIR:-/tmp}/sai-sprint-smoke-api.log"
echo "==> Starting API (log: $LOG_FILE)"
cd "${REPO_ROOT}/apps/api"
nohup node dist/main.js >"$LOG_FILE" 2>&1 &
API_PID=$!
cd "${REPO_ROOT}"

for i in $(seq 1 90); do
  if curl -sf "http://127.0.0.1:${PORT}/health" &>/dev/null; then
    echo "✅ API up (attempt $i)"
    break
  fi
  if [[ "$i" -eq 90 ]]; then
    echo "❌ API failed to become healthy within 90s"
    tail -n 100 "$LOG_FILE" || true
    exit 1
  fi
  sleep 1
done

echo "==> npm run test:sprint"
npm run test:sprint

echo ""
echo "✅ Local sprint smoke complete (API stopped; Postgres still running)."
