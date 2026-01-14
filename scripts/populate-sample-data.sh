#!/bin/bash

# Get auth token
TOKEN=$(curl -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@sai.com","password":"Password123"}' | \
  python3 -c "import sys, json; print(json.load(sys.stdin)['data']['token'])" 2>/dev/null)

if [ -z "$TOKEN" ]; then
  echo "Failed to get auth token"
  exit 1
fi

echo "✅ Got auth token"
echo "Creating sample data..."

# Create AI Tools
echo "📦 Creating AI Tools..."

curl -s -X POST http://localhost:3001/api/inventory \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "ChatGPT Enterprise",
    "category": "LLM",
    "vendor": "OpenAI",
    "description": "Enterprise-grade LLM for customer support and content generation",
    "url": "https://openai.com/enterprise",
    "dataTypes": ["PII", "Financial"],
    "users": 150,
    "frequency": "Daily",
    "controls": ["MFA", "Encryption", "DLP", "AuditLog"],
    "hasDPA": true,
    "dataResidency": "EU",
    "notes": "Approved for customer-facing applications"
  }' > /dev/null

curl -s -X POST http://localhost:3001/api/inventory \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "GitHub Copilot",
    "category": "CodeGen",
    "vendor": "GitHub",
    "description": "AI pair programmer for code generation",
    "url": "https://github.com/features/copilot",
    "dataTypes": ["IP", "Proprietary"],
    "users": 85,
    "frequency": "Daily",
    "controls": ["MFA", "Encryption", "AuditLog"],
    "hasDPA": true,
    "dataResidency": "Multi-region",
    "notes": "Used by engineering team"
  }' > /dev/null

curl -s -X POST http://localhost:3001/api/inventory \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Midjourney",
    "category": "ImageGen",
    "vendor": "Midjourney Inc",
    "description": "AI image generation for marketing materials",
    "url": "https://midjourney.com",
    "dataTypes": ["Public"],
    "users": 25,
    "frequency": "Weekly",
    "controls": ["MFA"],
    "hasDPA": false,
    "dataResidency": "US",
    "notes": "Low risk, public data only"
  }' > /dev/null

curl -s -X POST http://localhost:3001/api/inventory \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Salesforce Einstein",
    "category": "Analytics",
    "vendor": "Salesforce",
    "description": "AI-powered sales predictions and analytics",
    "url": "https://salesforce.com/einstein",
    "dataTypes": ["PII", "Financial", "Proprietary"],
    "users": 200,
    "frequency": "Daily",
    "controls": ["MFA", "Encryption", "DLP", "AuditLog", "DataResidency"],
    "hasDPA": true,
    "dataResidency": "EU",
    "notes": "Critical business system"
  }' > /dev/null

curl -s -X POST http://localhost:3001/api/inventory \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "DeepL Translator",
    "category": "LLM",
    "vendor": "DeepL",
    "description": "AI translation service for customer communications",
    "url": "https://deepl.com",
    "dataTypes": ["PII"],
    "users": 40,
    "frequency": "Daily",
    "controls": ["Encryption", "DLP"],
    "hasDPA": true,
    "dataResidency": "EU",
    "notes": "GDPR compliant"
  }' > /dev/null

echo "✅ Created 5 AI Tools"

# Create Risks
echo "⚠️  Creating Risks..."

curl -s -X POST http://localhost:3001/api/risks \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Data Leakage Risk - ChatGPT",
    "description": "Risk of PII being exposed through ChatGPT prompts",
    "likelihood": 4,
    "impact": 5,
    "category": "Data Security"
  }' > /dev/null

curl -s -X POST http://localhost:3001/api/risks \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Code IP Exposure - GitHub Copilot",
    "description": "Risk of proprietary code being leaked through Copilot suggestions",
    "likelihood": 3,
    "impact": 4,
    "category": "Intellectual Property"
  }' > /dev/null

curl -s -X POST http://localhost:3001/api/risks \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Vendor Lock-in - Salesforce",
    "description": "High dependency on Salesforce platform",
    "likelihood": 2,
    "impact": 4,
    "category": "Business Continuity"
  }' > /dev/null

echo "✅ Created 3 Risks"

# Create Policies
echo "📜 Creating Policies..."

POLICY1=$(curl -s -X POST http://localhost:3001/api/governance/policies \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "AI Usage Policy",
    "description": "Governance policy for AI tool usage and approval",
    "status": "ACTIVE"
  }' | python3 -c "import sys, json; print(json.load(sys.stdin)['data']['id'])" 2>/dev/null)

POLICY2=$(curl -s -X POST http://localhost:3001/api/governance/policies \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Data Handling Policy",
    "description": "Policy for handling PII and sensitive data in AI tools",
    "status": "ACTIVE"
  }' | python3 -c "import sys, json; print(json.load(sys.stdin)['data']['id'])" 2>/dev/null)

echo "✅ Created 2 Policies"

# Create Controls
echo "🛡️  Creating Controls..."

CONTROL1=$(curl -s -X POST http://localhost:3001/api/governance/controls \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"MFA Enforcement\",
    \"description\": \"All AI tools must require MFA for access\",
    \"status\": \"ACTIVE\",
    \"policyId\": \"$POLICY1\"
  }" | python3 -c "import sys, json; print(json.load(sys.stdin)['data']['id'])" 2>/dev/null)

CONTROL2=$(curl -s -X POST http://localhost:3001/api/governance/controls \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"DPA Requirement\",
    \"description\": \"All AI tools processing PII must have signed DPA\",
    \"status\": \"ACTIVE\",
    \"policyId\": \"$POLICY2\"
  }" | python3 -c "import sys, json; print(json.load(sys.stdin)['data']['id'])" 2>/dev/null)

CONTROL3=$(curl -s -X POST http://localhost:3001/api/governance/controls \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"Data Encryption\",
    \"description\": \"All data in transit and at rest must be encrypted\",
    \"status\": \"ACTIVE\",
    \"policyId\": \"$POLICY2\"
  }" | python3 -c "import sys, json; print(json.load(sys.stdin)['data']['id'])" 2>/dev/null)

echo "✅ Created 3 Controls"

# Create Evidence
echo "📋 Creating Evidence..."

curl -s -X POST http://localhost:3001/api/evidence \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"controlId\": \"$CONTROL1\",
    \"source\": \"Upload\",
    \"status\": \"APPROVED\",
    \"validFrom\": \"2026-01-01T00:00:00Z\",
    \"validTo\": \"2026-12-31T23:59:59Z\",
    \"reference\": \"MFA-Audit-2026.pdf\"
  }" > /dev/null

curl -s -X POST http://localhost:3001/api/evidence \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"controlId\": \"$CONTROL2\",
    \"source\": \"Upload\",
    \"status\": \"APPROVED\",
    \"validFrom\": \"2026-01-01T00:00:00Z\",
    \"validTo\": \"2027-01-01T23:59:59Z\",
    \"reference\": \"DPA-OpenAI-2026.pdf\"
  }" > /dev/null

echo "✅ Created 2 Evidence records"

# Create Incidents
echo "🚨 Creating Incidents..."

curl -s -X POST http://localhost:3001/api/incidents \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Unauthorized AI Tool Usage",
    "description": "Employee used unapproved AI tool for customer data processing",
    "severity": "High",
    "status": "CLASSIFIED",
    "detectedAt": "2026-01-10T10:00:00Z"
  }' > /dev/null

curl -s -X POST http://localhost:3001/api/incidents \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Data Residency Violation",
    "description": "AI tool processing EU data in US region",
    "severity": "Critical",
    "status": "ESCALATED",
    "detectedAt": "2026-01-12T14:30:00Z"
  }' > /dev/null

echo "✅ Created 2 Incidents"

# Create Vendors
echo "🏢 Creating Vendors..."

curl -s -X POST http://localhost:3001/api/vendors \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "OpenAI",
    "region": "US/EU",
    "subprocessors": ["Microsoft Azure", "Anthropic"],
    "securityReviewStatus": "Approved"
  }' > /dev/null

curl -s -X POST http://localhost:3001/api/vendors \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Salesforce",
    "region": "Global",
    "subprocessors": ["AWS", "Google Cloud"],
    "securityReviewStatus": "Approved"
  }' > /dev/null

echo "✅ Created 2 Vendors"

echo ""
echo "🎉 Sample data creation complete!"
echo ""
echo "Summary:"
echo "  ✅ 5 AI Tools"
echo "  ✅ 3 Risks"
echo "  ✅ 2 Policies"
echo "  ✅ 3 Controls"
echo "  ✅ 2 Evidence records"
echo "  ✅ 2 Incidents"
echo "  ✅ 2 Vendors"
echo ""
echo "You can now explore the full functionality at http://localhost:3000"
