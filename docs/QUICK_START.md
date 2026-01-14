# Quick Start Guide

## Setup (5 minutes)

```bash
# 1. Install dependencies
npm install

# 2. Start database
docker-compose up -d

# 3. Setup database
cd apps/api
npm run db:generate && npm run db:migrate
cd ../..

# 4. Start dev servers
npm run dev
```

Access:
- Frontend: http://localhost:3000
- API: http://localhost:3001

## Common Commands

```bash
npm run dev          # Start all services
npm run build        # Build all packages
cd apps/api && npm run db:studio  # Database GUI
```

## Troubleshooting

**Port in use**: Change `PORT` in `apps/api/.env` or `apps/web/package.json`  
**Database issues**: `docker-compose ps` → verify DATABASE_URL → `docker-compose restart`  
**Build errors**: `rm -rf node_modules apps/*/node_modules packages/*/node_modules && npm install`

For detailed setup, see [GETTING_STARTED.md](./GETTING_STARTED.md)
