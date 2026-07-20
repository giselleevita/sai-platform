#!/bin/bash
# Sprint smoke: public health, OIDC probe, auth rejection (no cookies).
# Requires API running: npm run dev (from repo root) or apps/api only.

set -euo pipefail

API_URL="${API_URL:-http://localhost:3001}"

fail() {
  echo "❌ $1"
  exit 1
}

echo "==> SAI sprint smoke (API_URL=$API_URL)"

if ! curl -sf "$API_URL/health" >/dev/null; then
  fail "API not reachable at $API_URL — start the API (e.g. npm run dev from sai-platform) and retry."
fi
echo "✅ GET /health"

API_HEALTH_JSON="$(curl -sf "$API_URL/api/health")" || fail "GET /api/health failed"
echo "$API_HEALTH_JSON" | jq -e '.status == "ok"' >/dev/null || fail "GET /api/health invalid JSON or status"
echo "✅ GET /api/health"

OIDC_JSON="$(curl -sf "$API_URL/api/health/oidc")" || fail "GET /api/health/oidc failed"
echo "$OIDC_JSON" | jq -e '.oidcEnabled | type == "boolean"' >/dev/null || fail "GET /api/health/oidc invalid JSON"
echo "✅ GET /api/health/oidc (oidcEnabled=$(echo "$OIDC_JSON" | jq -r '.oidcEnabled'))"

EMAIL_JSON="$(curl -sf "$API_URL/api/health/email")" || fail "GET /api/health/email failed"
echo "$EMAIL_JSON" | jq -e '.mode | type == "string"' >/dev/null || fail "GET /api/health/email invalid JSON"
echo "✅ GET /api/health/email (mode=$(echo "$EMAIL_JSON" | jq -r '.mode'))"

DOCS_JSON="$(curl -sf "$API_URL/api-docs")" || fail "GET /api-docs failed"
echo "$DOCS_JSON" | jq -e '.openapi == "3.0.0"' >/dev/null || fail "GET /api-docs invalid openapi version"
echo "$DOCS_JSON" | jq -e '.paths["/api/inventory/{id}/governance"] != null' >/dev/null || fail "GET /api-docs missing inventory governance path"
echo "✅ GET /api-docs (OpenAPI 3.0 + inventory governance paths)"

# The legacy endpoint must preserve the request through a temporary redirect.
LEGACY_HEADERS="$(curl -sS -D - -o /dev/null -X POST "$API_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"nobody@example.com","password":"wrong-pass"}')"
echo "$LEGACY_HEADERS" | grep -Eq '^HTTP/[^ ]+ 307' || fail "POST /api/auth/login expected HTTP 307"
echo "$LEGACY_HEADERS" | tr -d '\r' | grep -Eqi '^location: /api/v1/auth/login$' \
  || fail "POST /api/auth/login did not redirect to /api/v1/auth/login"
echo "✅ POST /api/auth/login redirects to canonical API route (307)"

# The canonical endpoint must still reject bad credentials.
LOGIN_CODE="$(curl -sS -o /tmp/sai-sprint-login.json -w '%{http_code}' -X POST "$API_URL/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"nobody@example.com","password":"wrong-pass"}')"

if [ "$LOGIN_CODE" != "401" ]; then
  echo "Response body:"
  cat /tmp/sai-sprint-login.json 2>/dev/null || true
  fail "POST /api/v1/auth/login expected HTTP 401 for bad credentials, got $LOGIN_CODE"
fi
echo "✅ POST /api/v1/auth/login rejects bad credentials (401)"

rm -f /tmp/sai-sprint-login.json
echo ""
echo "✅ Sprint smoke passed."
