#!/bin/bash

# Test Governance Endpoints
# Requires: API running on http://localhost:3001
# Requires: Valid auth token (create user first)

API_URL="http://localhost:3001"
TOKEN_FILE="/tmp/sai_test_token.txt"

echo "🧪 Testing Governance Endpoints"
echo "================================"
echo ""

# Helper function to get auth token
get_token() {
  if [ -f "$TOKEN_FILE" ]; then
    cat "$TOKEN_FILE"
  else
    echo ""
  fi
}

# Helper function to make authenticated request
api_request() {
  local method=$1
  local endpoint=$2
  local data=$3
  local token=$(get_token)
  
  if [ -z "$token" ]; then
    echo "❌ No auth token. Please sign up/login first."
    return 1
  fi
  
  if [ "$method" = "GET" ] || [ "$method" = "DELETE" ]; then
    curl -s -X "$method" \
      -H "Authorization: Bearer $token" \
      -H "Content-Type: application/json" \
      "$API_URL$endpoint"
  else
    curl -s -X "$method" \
      -H "Authorization: Bearer $token" \
      -H "Content-Type: application/json" \
      -d "$data" \
      "$API_URL$endpoint"
  fi
}

# Test Health
echo "1. Testing Health Endpoint..."
health=$(curl -s "$API_URL/health")
if echo "$health" | grep -q "ok"; then
  echo "   ✅ Health check passed"
else
  echo "   ❌ Health check failed: $health"
  exit 1
fi
echo ""

# Test Policies
echo "2. Testing Policies Endpoints..."
echo "   a) List policies..."
policies_list=$(api_request "GET" "/api/governance/policies")
if echo "$policies_list" | grep -q "success"; then
  echo "      ✅ GET /api/governance/policies"
else
  echo "      ❌ GET /api/governance/policies: $policies_list"
fi

echo "   b) Create policy..."
policy_data='{"name":"Test Policy","description":"Test description","status":"DRAFT"}'
policy_create=$(api_request "POST" "/api/governance/policies" "$policy_data")
if echo "$policy_create" | grep -q "success"; then
  POLICY_ID=$(echo "$policy_create" | grep -o '"id":"[^"]*' | cut -d'"' -f4)
  echo "      ✅ POST /api/governance/policies (ID: $POLICY_ID)"
  
  echo "   c) Update policy..."
  update_data='{"name":"Updated Policy","status":"ACTIVE"}'
  policy_update=$(api_request "PATCH" "/api/governance/policies/$POLICY_ID" "$update_data")
  if echo "$policy_update" | grep -q "success"; then
    echo "      ✅ PATCH /api/governance/policies/$POLICY_ID"
  else
    echo "      ❌ PATCH /api/governance/policies/$POLICY_ID: $policy_update"
  fi
  
  echo "   d) Delete policy..."
  policy_delete=$(api_request "DELETE" "/api/governance/policies/$POLICY_ID")
  if echo "$policy_delete" | grep -q "success"; then
    echo "      ✅ DELETE /api/governance/policies/$POLICY_ID"
  else
    echo "      ❌ DELETE /api/governance/policies/$POLICY_ID: $policy_delete"
  fi
else
  echo "      ❌ POST /api/governance/policies: $policy_create"
fi
echo ""

# Test Controls
echo "3. Testing Controls Endpoints..."
echo "   a) List controls..."
controls_list=$(api_request "GET" "/api/governance/controls")
if echo "$controls_list" | grep -q "success"; then
  echo "      ✅ GET /api/governance/controls"
else
  echo "      ❌ GET /api/governance/controls: $controls_list"
fi

echo "   b) Create control..."
control_data='{"name":"Test Control","description":"Test control description","status":"DRAFT"}'
control_create=$(api_request "POST" "/api/governance/controls" "$control_data")
if echo "$control_create" | grep -q "success"; then
  CONTROL_ID=$(echo "$control_create" | grep -o '"id":"[^"]*' | cut -d'"' -f4)
  echo "      ✅ POST /api/governance/controls (ID: $CONTROL_ID)"
  
  echo "   c) Update control status..."
  update_data='{"status":"UNDER_REVIEW"}'
  control_update=$(api_request "PATCH" "/api/governance/controls/$CONTROL_ID" "$update_data")
  if echo "$control_update" | grep -q "success"; then
    echo "      ✅ PATCH /api/governance/controls/$CONTROL_ID (lifecycle)"
  else
    echo "      ❌ PATCH /api/governance/controls/$CONTROL_ID: $control_update"
  fi
  
  echo "   d) Delete control..."
  control_delete=$(api_request "DELETE" "/api/governance/controls/$CONTROL_ID")
  if echo "$control_delete" | grep -q "success"; then
    echo "      ✅ DELETE /api/governance/controls/$CONTROL_ID"
  else
    echo "      ❌ DELETE /api/governance/controls/$CONTROL_ID: $control_delete"
  fi
else
  echo "      ❌ POST /api/governance/controls: $control_create"
fi
echo ""

# Test Procedures
echo "4. Testing Procedures Endpoints..."
echo "   a) List procedures..."
procedures_list=$(api_request "GET" "/api/governance/procedures")
if echo "$procedures_list" | grep -q "success"; then
  echo "      ✅ GET /api/governance/procedures"
else
  echo "      ❌ GET /api/governance/procedures: $procedures_list"
fi

echo "   b) Create procedure..."
# First create a control for the procedure
control_for_proc='{"name":"Control for Procedure","status":"ACTIVE"}'
control_proc=$(api_request "POST" "/api/governance/controls" "$control_for_proc")
PROC_CONTROL_ID=$(echo "$control_proc" | grep -o '"id":"[^"]*' | cut -d'"' -f4)

if [ -n "$PROC_CONTROL_ID" ]; then
  procedure_data="{\"name\":\"Test Procedure\",\"controlId\":\"$PROC_CONTROL_ID\",\"steps\":{\"step1\":\"Do this\",\"step2\":\"Do that\"}}"
  procedure_create=$(api_request "POST" "/api/governance/procedures" "$procedure_data")
  if echo "$procedure_create" | grep -q "success"; then
    PROCEDURE_ID=$(echo "$procedure_create" | grep -o '"id":"[^"]*' | cut -d'"' -f4)
    echo "      ✅ POST /api/governance/procedures (ID: $PROCEDURE_ID)"
    
    echo "   c) Delete procedure..."
    procedure_delete=$(api_request "DELETE" "/api/governance/procedures/$PROCEDURE_ID")
    if echo "$procedure_delete" | grep -q "success"; then
      echo "      ✅ DELETE /api/governance/procedures/$PROCEDURE_ID"
    else
      echo "      ❌ DELETE /api/governance/procedures/$PROCEDURE_ID: $procedure_delete"
    fi
    
    # Clean up control
    api_request "DELETE" "/api/governance/controls/$PROC_CONTROL_ID" > /dev/null
  else
    echo "      ❌ POST /api/governance/procedures: $procedure_create"
  fi
fi
echo ""

# Test Regulations
echo "5. Testing Regulations Endpoints..."
echo "   a) List regulations..."
regulations_list=$(api_request "GET" "/api/governance/regulations")
if echo "$regulations_list" | grep -q "success"; then
  echo "      ✅ GET /api/governance/regulations"
else
  echo "      ❌ GET /api/governance/regulations: $regulations_list"
fi

echo "   b) Create regulation..."
regulation_data='{"framework":"NIS2","article":"Article 21","name":"Risk Management Measures","description":"Test regulation"}'
regulation_create=$(api_request "POST" "/api/governance/regulations" "$regulation_data")
if echo "$regulation_create" | grep -q "success"; then
  REGULATION_ID=$(echo "$regulation_create" | grep -o '"id":"[^"]*' | cut -d'"' -f4)
  echo "      ✅ POST /api/governance/regulations (ID: $REGULATION_ID)"
  
  echo "   c) Delete regulation..."
  regulation_delete=$(api_request "DELETE" "/api/governance/regulations/$REGULATION_ID")
  if echo "$regulation_delete" | grep -q "success"; then
    echo "      ✅ DELETE /api/governance/regulations/$REGULATION_ID"
  else
    echo "      ❌ DELETE /api/governance/regulations/$REGULATION_ID: $regulation_delete"
  fi
else
  echo "      ❌ POST /api/governance/regulations: $regulation_create"
fi
echo ""

echo "================================"
echo "✅ Governance endpoint tests completed!"
echo ""
echo "Note: To test with authentication, first sign up/login and save token:"
echo "  TOKEN=\$(curl -s -X POST $API_URL/api/auth/login -H 'Content-Type: application/json' -d '{\"email\":\"test@example.com\",\"password\":\"password\"}' | grep -o '\"token\":\"[^\"]*' | cut -d'\"' -f4)"
echo "  echo \$TOKEN > $TOKEN_FILE"
