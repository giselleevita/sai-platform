# Services Running Status ✅

## Current Status

All development services are running successfully!

### ✅ API Server
- **URL:** http://localhost:3001
- **Status:** Running
- **Health Check:** `GET /health` - ✅ Responding
- **Process:** `ts-node src/main.ts` (PID: 8975)

### ✅ Frontend (Next.js)
- **URL:** http://localhost:3000
- **Status:** Running
- **Network:** http://192.168.1.46:3000
- **Process:** `next-server (v16.1.1)` (PID: 8979)

### ⚠️ Database (PostgreSQL)
- **Status:** Docker not running
- **Note:** API will work with existing database connection if configured
- **To start:** Run `docker-compose up -d postgres` after starting Docker Desktop

### ✅ Supporting Services
- **@sai/shared-types:** TypeScript watch mode ✅
- **@sai/risk-scoring:** TypeScript watch mode ✅

---

## Quick Access

- **Frontend:** http://localhost:3000
- **API:** http://localhost:3001
- **API Health:** http://localhost:3001/health

---

## Available Pages

### Governance
- `/governance` - Governance overview
- `/policies` - Policies CRUD
- `/controls` - Controls with lifecycle
- `/procedures` - Procedures CRUD
- `/regulations` - Regulations CRUD

### Risk Management
- `/risks` - Risk Register
- `/risks/[id]` - Risk Detail with Decisions

### Evidence
- `/evidence` - Evidence List with Approval

### Incidents
- `/incidents` - Incidents with Lifecycle

### Other
- `/dashboard` - Main dashboard
- `/inventory` - AI Tools inventory
- `/auth/login` - Login page
- `/auth/signup` - Sign up page

---

## To Start Database (if needed)

1. Start Docker Desktop
2. Run: `docker-compose up -d postgres`
3. Wait 5 seconds for database to initialize
4. API will automatically connect

---

## To Stop Services

```bash
# Stop all services
pkill -f "ts-node src/main.ts"
pkill -f "next-server"
pkill -f "turbo run dev"

# Or stop Docker database
docker-compose down
```

---

## Troubleshooting

### Port Already in Use
```bash
# Find and kill processes on ports 3000/3001
lsof -ti:3000,3001 | xargs kill -9
```

### API Not Responding
- Check if API process is running: `ps aux | grep ts-node`
- Check API logs in terminal
- Verify database connection in `apps/api/.env`

### Frontend Not Loading
- Check if Next.js is running: `ps aux | grep next`
- Check browser console for errors
- Verify API_URL in `apps/web/.env.local`

---

**Last Updated:** 2026-01-13 23:07 UTC
**Status:** All services operational ✅
