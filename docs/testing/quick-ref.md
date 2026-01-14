# Quick Reference - 5-Minute Test Suite

⚡ **START HERE** - Quick verification checklist

## Prerequisites

```bash
# 1. Start database
docker-compose up -d postgres

# 2. Start servers
npm run dev
```

## 5-Minute Test Suite

### Test 1: Health Check ✅
```bash
curl http://localhost:3001/health
```
**Expected**: `{"status":"ok","timestamp":"..."}`

### Test 2: Signup ✅
```bash
curl -X POST http://localhost:3001/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@sai.com",
    "password": "Password123",
    "name": "Test User",
    "companyName": "Test Company"
  }'
```
**Expected**: `{"success":true,"data":{"token":"...","user":{...},"company":{...}}}`

**Save the token** from response!

### Test 3: Token Validation ✅
```bash
# Replace YOUR_TOKEN with token from Test 2
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3001/api/auth/me
```
**Expected**: `{"success":true,"data":{"id":"...","email":"test@sai.com",...}}`

### Test 4: Required Fields Validation ✅
```bash
curl -X POST http://localhost:3001/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email": "test2@test.com"}'
```
**Expected**: `{"success":false,"error":"..."}` (validation error)

### Test 5: Email Format Validation ✅
```bash
curl -X POST http://localhost:3001/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "invalid-email",
    "password": "Password123",
    "name": "Test",
    "companyName": "Test Co"
  }'
```
**Expected**: `{"success":false,"error":"Invalid email format"}`

### Test 6: Password Strength ✅
```bash
curl -X POST http://localhost:3001/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test3@test.com",
    "password": "weak",
    "name": "Test",
    "companyName": "Test Co"
  }'
```
**Expected**: `{"success":false,"error":"Password does not meet requirements"}`

### Test 7: Create AI Tool ✅
```bash
# Replace YOUR_TOKEN with token from Test 2
curl -X POST http://localhost:3001/api/inventory \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "name": "ChatGPT",
    "category": "LLM",
    "dataTypes": ["PII"],
    "users": 25,
    "frequency": "Daily",
    "controls": ["MFA"]
  }'
```
**Expected**: `{"success":true,"data":{"id":"...","riskScore":...,"riskLevel":"..."}}`

### Test 8: Company Isolation ✅
```bash
# Create second company
curl -X POST http://localhost:3001/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "company2@test.com",
    "password": "Password123",
    "name": "User 2",
    "companyName": "Company 2"
  }'
# Save token2

# Try to access first company's tools with second company's token
curl -H "Authorization: Bearer TOKEN2" \
  http://localhost:3001/api/inventory
```
**Expected**: Empty array `{"success":true,"data":[]}` (no tools from company 1)

### Test 9: List Tools ✅
```bash
# Use token from Test 2
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3001/api/inventory
```
**Expected**: `{"success":true,"data":[{"id":"...","name":"ChatGPT",...}]}`

### Test 10: Risk Summary ✅
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3001/api/inventory/summary
```
**Expected**: `{"success":true,"data":{"totalTools":1,"riskCounts":{...},"averageRiskScore":...}}`

## ✅ Verification Checklist

- [ ] All 10 tests pass
- [ ] No errors in console
- [ ] Company isolation works (Test 8)
- [ ] Validation works (Tests 4-6)
- [ ] Risk scoring works (Test 7)

## 🚨 If Tests Fail

1. Check database is running: `docker-compose ps`
2. Check servers are running: `npm run dev`
3. Check logs for errors
4. Verify .env files exist
5. Run migrations: `cd apps/api && npx prisma migrate dev`

## Next Steps

If all tests pass → Ready for **top-10-edge-cases.md** testing!
