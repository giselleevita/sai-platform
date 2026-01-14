#!/bin/bash

# SAI Platform API Test Suite
# Run this after starting the servers: npm run dev

set -e

API_URL="http://localhost:3001"
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "🧪 SAI Platform API Test Suite"
echo "================================"
echo ""

# Test counter
PASSED=0
FAILED=0

test() {
    local name="$1"
    local command="$2"
    local expected="$3"
    
    echo -n "Testing: $name... "
    
    result=$(eval "$command" 2>&1)
    
    if echo "$result" | grep -q "$expected"; then
        echo -e "${GREEN}✓ PASSED${NC}"
        ((PASSED++))
        return 0
    else
        echo -e "${RED}✗ FAILED${NC}"
        echo "  Expected: $expected"
        echo "  Got: $result"
        ((FAILED++))
        return 1
    fi
}

# Test 1: Health Check
test "Health Check" \
    "curl -s $API_URL/health" \
    '"status":"ok"'

# Test 2: Signup
SIGNUP_RESPONSE=$(curl -s -X POST $API_URL/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test'$(date +%s)'@sai.com",
    "password": "Password123",
    "name": "Test User",
    "companyName": "Test Company"
  }')

test "Signup" \
    "echo '$SIGNUP_RESPONSE'" \
    '"success":true'

# Extract token
TOKEN=$(echo $SIGNUP_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
    echo -e "${RED}✗ FAILED: Could not extract token${NC}"
    exit 1
fi

# Test 3: Get Me
test "Get Current User" \
    "curl -s -H 'Authorization: Bearer $TOKEN' $API_URL/api/auth/me" \
    '"success":true'

# Test 4: Email Validation
test "Email Format Validation" \
    "curl -s -X POST $API_URL/api/auth/signup -H 'Content-Type: application/json' -d '{\"email\":\"invalid\",\"password\":\"Password123\",\"name\":\"Test\",\"companyName\":\"Test\"}'" \
    '"error"'

# Test 5: Password Strength
test "Password Strength Validation" \
    "curl -s -X POST $API_URL/api/auth/signup -H 'Content-Type: application/json' -d '{\"email\":\"test2@test.com\",\"password\":\"weak\",\"name\":\"Test\",\"companyName\":\"Test\"}'" \
    '"error"'

# Test 6: Create Tool
TOOL_RESPONSE=$(curl -s -X POST $API_URL/api/inventory \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "ChatGPT",
    "category": "LLM",
    "dataTypes": ["PII"],
    "users": 25,
    "frequency": "Daily",
    "controls": ["MFA"]
  }')

test "Create AI Tool" \
    "echo '$TOOL_RESPONSE'" \
    '"success":true'

# Extract tool ID
TOOL_ID=$(echo $TOOL_RESPONSE | grep -o '"id":"[^"]*' | cut -d'"' -f4)

# Test 7: List Tools
test "List Tools" \
    "curl -s -H 'Authorization: Bearer $TOKEN' $API_URL/api/inventory" \
    '"success":true'

# Test 8: Get Tool
test "Get Tool by ID" \
    "curl -s -H 'Authorization: Bearer $TOKEN' $API_URL/api/inventory/$TOOL_ID" \
    '"success":true'

# Test 9: Risk Summary
test "Risk Summary" \
    "curl -s -H 'Authorization: Bearer $TOKEN' $API_URL/api/inventory/summary" \
    '"success":true'

# Test 10: Company Isolation
COMPANY2_RESPONSE=$(curl -s -X POST $API_URL/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "company2'$(date +%s)'@test.com",
    "password": "Password123",
    "name": "User 2",
    "companyName": "Company 2"
  }')

TOKEN2=$(echo $COMPANY2_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)

# Company 2 should not see Company 1's tools
ISOLATION_RESPONSE=$(curl -s -H "Authorization: Bearer $TOKEN2" $API_URL/api/inventory)
test "Company Isolation" \
    "echo '$ISOLATION_RESPONSE' | grep -o '\"data\":\\[\\]'" \
    '"data":[]'

# Summary
echo ""
echo "================================"
echo "Test Results:"
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ All tests passed!${NC}"
    exit 0
else
    echo -e "${RED}❌ Some tests failed${NC}"
    exit 1
fi
