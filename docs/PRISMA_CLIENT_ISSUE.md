# Prisma Client Generation Issue

## Problem
Prisma Client generation fails with:
```
Error: Could not resolve @prisma/client despite the installation that we just tried.
```

## Root Cause
This is a known issue with Prisma in npm workspaces/monorepos. The Prisma generator can't resolve `@prisma/client` during generation, even though it's installed.

## Current Workaround
Using type assertions `(prisma as any)` in all service files to bypass TypeScript errors. The server runs correctly at runtime because:
1. The database schema is synced (`prisma db push` works)
2. The runtime Prisma Client works (models are available at runtime)
3. Only TypeScript type checking fails

## Files Using Workaround
- `apps/api/src/services/auth.service.ts` (4 assertions)
- `apps/api/src/services/audit-log.service.ts` (2 assertions)
- `apps/api/src/services/evidence.service.ts` (4 assertions)
- `apps/api/src/services/governance.service.ts` (16 assertions)
- `apps/api/src/services/risk.service.ts` (7 assertions)
- `apps/api/src/services/incident.service.ts` (4 assertions)
- `apps/api/src/services/exception.service.ts` (3 assertions)
- `apps/api/src/services/vendor.service.ts` (4 assertions)

**Total: 44 type assertions**

## Potential Solutions (Future)

1. **Use Prisma's output path configuration:**
   ```prisma
   generator client {
     provider = "prisma-client-js"
     output   = "./node_modules/@prisma/client"
   }
   ```

2. **Install @prisma/client at root level:**
   ```bash
   npm install @prisma/client --workspace-root
   ```

3. **Use postinstall script:**
   Already added to `package.json`, but generation still fails.

4. **Manual generation workaround:**
   ```bash
   cd apps/api
   npx prisma generate --schema=./prisma/schema.prisma
   # Then manually copy generated client
   ```

5. **Consider Prisma 7.x migration:**
   Prisma 7 has better monorepo support, but requires schema changes.

## Status
- ✅ Server runs correctly
- ✅ Database operations work
- ⚠️ Type safety reduced (using `as any`)
- ⚠️ IDE autocomplete doesn't work for Prisma models

## Priority
**Low** - Functionality works, only type safety is affected. Can be addressed in a future refactor.
