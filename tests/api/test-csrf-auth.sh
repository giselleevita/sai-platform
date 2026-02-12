#!/bin/bash

# CSRF/auth smoke test
# Validates cookie session login + CSRF protection behavior on protected write endpoints

set -euo pipefail

API_URL="${API_URL:-http://localhost:3001}"
COOKIE_JAR="$(mktemp /tmp/sai-csrf-cookies.XXXXXX)"
EMAIL="csrf-$(date +%s)@sai.local"
PASSWORD="Password123"

cleanup() {
  rm -f "$COOKIE_JAR"
}
trap cleanup EXIT

require_success() {
  local label="$1"
  local json="$2"

  if ! echo "$json" | jq -e '.success == true' >/dev/null 2>&1; then
    echo "❌ $label failed"
    echo "$json" | jq . 2>/dev/null || echo "$json"
    exit 1
  fi
  echo "✅ $label"
}

echo "==> Signup and establish cookie session"
SIGNUP_PAYLOAD="$(jq -nc \
  --arg email "$EMAIL" \
  --arg password "$PASSWORD" \
  '{email:$email,password:$password,name:"CSRF Smoke",companyName:"CSRF Smoke Co"}')"

SIGNUP_RESPONSE="$(curl -sS -X POST "$API_URL/api/auth/signup" \
  -H 'Content-Type: application/json' \
  -c "$COOKIE_JAR" -b "$COOKIE_JAR" \
  -d "$SIGNUP_PAYLOAD")"
require_success "Signup" "$SIGNUP_RESPONSE"

CSRF_TOKEN="$(echo "$SIGNUP_RESPONSE" | jq -r '.data.csrfToken // empty')"
if [ -z "$CSRF_TOKEN" ]; then
  echo "❌ Missing csrfToken in signup response"
  exit 1
fi

echo "✅ Received CSRF token"

echo "==> Protected write without CSRF header should fail"
NO_CSRF_RAW="$(curl -sS -X POST "$API_URL/api/inventory" \
  -H 'Content-Type: application/json' \
  -c "$COOKIE_JAR" -b "$COOKIE_JAR" \
  -d '{"name":"CSRF Missing Header","category":"LLM","dataTypes":["PII"],"users":1,"frequency":"Daily","controls":[]}' \
  -w $'\n%{http_code}')"
NO_CSRF_BODY="$(echo "$NO_CSRF_RAW" | sed '$d')"
NO_CSRF_CODE="$(echo "$NO_CSRF_RAW" | tail -n1)"

if [ "$NO_CSRF_CODE" != "401" ]; then
  echo "❌ Expected 401 without CSRF header, got $NO_CSRF_CODE"
  echo "$NO_CSRF_BODY" | jq . 2>/dev/null || echo "$NO_CSRF_BODY"
  exit 1
fi

if ! echo "$NO_CSRF_BODY" | jq -e '.error | test("CSRF"; "i")' >/dev/null 2>&1; then
  echo "❌ Expected CSRF-related error message"
  echo "$NO_CSRF_BODY" | jq . 2>/dev/null || echo "$NO_CSRF_BODY"
  exit 1
fi

echo "✅ Missing-CSRF failure mode confirmed (401)"

echo "==> Protected write with CSRF header should succeed"
WITH_CSRF_RAW="$(curl -sS -X POST "$API_URL/api/inventory" \
  -H 'Content-Type: application/json' \
  -H "X-CSRF-Token: $CSRF_TOKEN" \
  -c "$COOKIE_JAR" -b "$COOKIE_JAR" \
  -d '{"name":"CSRF Header Present","category":"LLM","dataTypes":["PII"],"users":1,"frequency":"Daily","controls":[]}' \
  -w $'\n%{http_code}')"
WITH_CSRF_BODY="$(echo "$WITH_CSRF_RAW" | sed '$d')"
WITH_CSRF_CODE="$(echo "$WITH_CSRF_RAW" | tail -n1)"

if [ "$WITH_CSRF_CODE" != "201" ]; then
  echo "❌ Expected 201 with CSRF header, got $WITH_CSRF_CODE"
  echo "$WITH_CSRF_BODY" | jq . 2>/dev/null || echo "$WITH_CSRF_BODY"
  exit 1
fi

require_success "Create inventory item with CSRF" "$WITH_CSRF_BODY"

echo "==> CSRF/auth smoke test passed"
echo "   user: $EMAIL"
