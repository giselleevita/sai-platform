#!/bin/sh
# Runs the API and the web app side by side in one container.
#
# If either process dies the container exits, so the platform restarts the
# whole thing rather than serving a half-dead demo where pages load and every
# request behind them fails.
set -e

cd /app/api

echo "[demo] applying migrations"
npx prisma migrate deploy

if [ "${SEED_ON_START}" = "true" ]; then
  echo "[demo] seeding demo data"
  node dist/seed.js
fi

echo "[demo] starting API on ${API_PORT}"
PORT="${API_PORT}" node dist/main.js &
API_PID=$!

# The web app proxies to the API, so it should not accept traffic first.
i=0
until wget -q -O /dev/null "http://localhost:${API_PORT}/health" 2>/dev/null; do
  i=$((i + 1))
  if [ "$i" -gt 60 ]; then
    echo "[demo] API did not become healthy in time"
    kill "$API_PID" 2>/dev/null || true
    exit 1
  fi
  sleep 1
done
echo "[demo] API healthy"

cd /app/web
echo "[demo] starting web on ${PORT}"
npx next start --hostname 0.0.0.0 --port "${PORT}" &
WEB_PID=$!

terminate() {
  kill "$API_PID" "$WEB_PID" 2>/dev/null || true
  exit 0
}
trap terminate TERM INT

# Exit as soon as either process does.
while kill -0 "$API_PID" 2>/dev/null && kill -0 "$WEB_PID" 2>/dev/null; do
  sleep 5
done

echo "[demo] a process exited, shutting the container down"
kill "$API_PID" "$WEB_PID" 2>/dev/null || true
exit 1
