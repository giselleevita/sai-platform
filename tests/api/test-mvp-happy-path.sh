#!/bin/bash

# MVP happy-path smoke test
# Validates: Auth -> Inventory -> Risk -> Policy/Control -> Evidence -> Report

set -euo pipefail

API_URL="${API_URL:-http://localhost:3001}"
COOKIE_JAR="$(mktemp /tmp/sai-mvp-cookies.XXXXXX)"
TIMESTAMP="$(date +%s)"
EMAIL="mvp-${TIMESTAMP}@sai.local"
PASSWORD="Password123"

cleanup() {
  rm -f "$COOKIE_JAR"
}
trap cleanup EXIT

log_step() {
  echo ""
  echo "==> $1"
}

require_ok() {
  local label="$1"
  local response="$2"

  if ! echo "$response" | jq -e '.success == true' >/dev/null 2>&1; then
    echo "❌ $label failed"
    echo "$response" | jq . 2>/dev/null || echo "$response"
    exit 1
  fi

  echo "✅ $label"
}

post_json() {
  local endpoint="$1"
  local payload="$2"
  local csrf_token="${3:-}"

  if [ -n "$csrf_token" ]; then
    curl -sS -X POST "$API_URL$endpoint" \
      -H "Content-Type: application/json" \
      -H "x-csrf-token: $csrf_token" \
      -b "$COOKIE_JAR" -c "$COOKIE_JAR" \
      -d "$payload"
  else
    curl -sS -X POST "$API_URL$endpoint" \
      -H "Content-Type: application/json" \
      -b "$COOKIE_JAR" -c "$COOKIE_JAR" \
      -d "$payload"
  fi
}

get_json() {
  local endpoint="$1"
  curl -sS -X GET "$API_URL$endpoint" \
    -b "$COOKIE_JAR" -c "$COOKIE_JAR"
}

log_step "Check API health"
HEALTH_RESPONSE="$(get_json '/health')"
if ! echo "$HEALTH_RESPONSE" | jq -e '.status == "ok"' >/dev/null 2>&1; then
  echo "❌ API health check failed"
  echo "$HEALTH_RESPONSE"
  exit 1
fi
echo "✅ Health check"

log_step "Signup fresh management user"
SIGNUP_PAYLOAD="$(jq -nc \
  --arg email "$EMAIL" \
  --arg password "$PASSWORD" \
  '{email:$email,password:$password,name:"MVP Tester",companyName:"MVP Test Company"}')"
SIGNUP_RESPONSE="$(post_json '/api/auth/signup' "$SIGNUP_PAYLOAD")"
require_ok "Signup" "$SIGNUP_RESPONSE"

CSRF_TOKEN="$(echo "$SIGNUP_RESPONSE" | jq -r '.data.csrfToken // empty')"
if [ -z "$CSRF_TOKEN" ]; then
  echo "❌ Missing CSRF token from signup response"
  exit 1
fi
echo "✅ CSRF token received"

log_step "Create AI tool in inventory"
TOOL_PAYLOAD='{
  "name": "MVP Tool",
  "category": "LLM",
  "vendor": "OpenAI",
  "dataTypes": ["PII"],
  "users": 10,
  "frequency": "Daily",
  "controls": ["MFA"],
  "hasDPA": true
}'
TOOL_RESPONSE="$(post_json '/api/inventory' "$TOOL_PAYLOAD" "$CSRF_TOKEN")"
require_ok "Create tool" "$TOOL_RESPONSE"
TOOL_ID="$(echo "$TOOL_RESPONSE" | jq -r '.data.id // empty')"
if [ -z "$TOOL_ID" ]; then
  echo "❌ Could not extract tool ID"
  exit 1
fi

log_step "Create risk"
RISK_PAYLOAD='{
  "title": "MVP Data Leakage Risk",
  "description": "PII exposure through prompts",
  "likelihood": 3,
  "impact": 4,
  "category": "Data Security"
}'
RISK_RESPONSE="$(post_json '/api/risks' "$RISK_PAYLOAD" "$CSRF_TOKEN")"
require_ok "Create risk" "$RISK_RESPONSE"
RISK_ID="$(echo "$RISK_RESPONSE" | jq -r '.data.id // empty')"
if [ -z "$RISK_ID" ]; then
  echo "❌ Could not extract risk ID"
  exit 1
fi

log_step "Create policy + control for evidence"
POLICY_PAYLOAD='{"name":"MVP Policy","description":"MVP policy","status":"ACTIVE"}'
POLICY_RESPONSE="$(post_json '/api/governance/policies' "$POLICY_PAYLOAD" "$CSRF_TOKEN")"
require_ok "Create policy" "$POLICY_RESPONSE"
POLICY_ID="$(echo "$POLICY_RESPONSE" | jq -r '.data.id // empty')"
if [ -z "$POLICY_ID" ]; then
  echo "❌ Could not extract policy ID"
  exit 1
fi

CONTROL_PAYLOAD="$(jq -nc --arg policyId "$POLICY_ID" '{name:"MVP Control",description:"Control for evidence",status:"ACTIVE",policyId:$policyId}')"
CONTROL_RESPONSE="$(post_json '/api/governance/controls' "$CONTROL_PAYLOAD" "$CSRF_TOKEN")"
require_ok "Create control" "$CONTROL_RESPONSE"
CONTROL_ID="$(echo "$CONTROL_RESPONSE" | jq -r '.data.id // empty')"
if [ -z "$CONTROL_ID" ]; then
  echo "❌ Could not extract control ID"
  exit 1
fi

log_step "Create evidence"
EVIDENCE_PAYLOAD="$(jq -nc --arg controlId "$CONTROL_ID" '{controlId:$controlId,source:"Upload",status:"APPROVED",reference:"mvp-evidence.pdf"}')"
EVIDENCE_RESPONSE="$(post_json '/api/evidence' "$EVIDENCE_PAYLOAD" "$CSRF_TOKEN")"
require_ok "Create evidence" "$EVIDENCE_RESPONSE"
EVIDENCE_ID="$(echo "$EVIDENCE_RESPONSE" | jq -r '.data.id // empty')"
if [ -z "$EVIDENCE_ID" ]; then
  echo "❌ Could not extract evidence ID"
  exit 1
fi

log_step "Generate risk assessment report (JSON)"
REPORT_RESPONSE="$(get_json '/api/reports/risk-assessment?format=json')"
require_ok "Generate risk report" "$REPORT_RESPONSE"

TOTAL_TOOLS="$(echo "$REPORT_RESPONSE" | jq -r '.data.summary.totalTools // 0')"
TOTAL_RISKS="$(echo "$REPORT_RESPONSE" | jq -r '.data.summary.totalRisks // 0')"

if [ "$TOTAL_TOOLS" -lt 1 ] || [ "$TOTAL_RISKS" -lt 1 ]; then
  echo "❌ Report summary does not include created data"
  echo "$REPORT_RESPONSE" | jq .
  exit 1
fi

log_step "MVP happy path completed"
echo "✅ Flow complete"
echo "   user: $EMAIL"
echo "   toolId: $TOOL_ID"
echo "   riskId: $RISK_ID"
echo "   evidenceId: $EVIDENCE_ID"
echo "   report summary: tools=$TOTAL_TOOLS risks=$TOTAL_RISKS"
