# Fix: Server Not Starting

## Problem
The server won't start because Prisma Client is missing models (`refreshToken`, `auditLog`, `evidence`, etc.) that exist in the schema but haven't been generated.

## Root Cause
Prisma Client needs to be regenerated after database migrations are run. The current client only has 4 models instead of all models in the schema.

## Solution

### Step 1: Start Docker & Database
```bash
# Start Docker Desktop first (if not running)
open -a Docker  # macOS
# or start Docker Desktop manually

# Wait for Docker to start, then:
cd /Users/yusaf/sai-platform
docker-compose up -d postgres

# Wait 5 seconds for database to initialize
sleep 5
```

### Step 2: Run Database Migrations
```bash
cd apps/api
npm run db:migrate
```

This will:
- Create all database tables
- Generate Prisma Client with all models

### Step 3: Verify Prisma Client
```bash
cd apps/api
npx ts-node -e "const { PrismaClient } = require('@prisma/client'); const p = new PrismaClient(); console.log('Models:', Object.keys(p).filter(k => !k.startsWith('_') && !k.startsWith('$')).join(', '));"
```

Should show: `user, company, aITool, riskScore, policy, control, procedure, regulation, risk, riskControl, decisionLog, evidence, incident, auditLog, complianceSnapshot, exception, vendor, refreshToken`

### Step 4: Start Server
```bash
cd /Users/yusaf/sai-platform
npm run dev
```

## Alternative: If Docker Won't Start

If Docker Desktop isn't available, you can:

1. **Use an external PostgreSQL database** - Update `apps/api/.env`:
   ```
   DATABASE_URL="postgresql://user:password@your-db-host:5432/sai_db"
   ```

2. **Or temporarily comment out problematic code** to test other features:
   - Comment out refresh token methods in `auth.service.ts`
   - Comment out audit log calls
   - Comment out evidence service calls

## Quick Fix Script

```bash
#!/bin/bash
# Quick fix script

echo "1. Starting Docker..."
open -a Docker
sleep 10

echo "2. Starting database..."
cd /Users/yusaf/sai-platform
docker-compose up -d postgres
sleep 5

echo "3. Running migrations..."
cd apps/api
npm run db:migrate

echo "4. Starting server..."
cd ../..
npm run dev
```

## Verification

Once fixed, you should see:
```
✅ API server running on http://localhost:3001
```

And `curl http://localhost:3001/health` should return:
```json
{"status":"ok","timestamp":"..."}
```
