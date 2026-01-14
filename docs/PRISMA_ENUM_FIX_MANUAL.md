# Manual Fix for Prisma Enum Error

## Current Error
```
Error converting field "role" of expected non-nullable type "String", 
found incompatible value of "OPERATOR".
```

## Root Cause
The Prisma Client was generated with an old schema where `role` was a `String`, but the database and current schema use the `UserRole` enum. The Prisma Client needs to be regenerated, but the installation is corrupted.

## Manual Fix Steps

### Option 1: Clean Reinstall (Recommended)

1. **Stop the API server:**
   ```bash
   pkill -f "ts-node.*main.ts"
   ```

2. **Remove Prisma packages:**
   ```bash
   cd apps/api
   rm -rf node_modules/prisma node_modules/@prisma
   ```

3. **Reinstall Prisma:**
   ```bash
   npm install prisma@5.22.0 @prisma/client@5.22.0 --save-exact
   ```

4. **Generate Prisma Client:**
   ```bash
   npx prisma generate
   ```

5. **Restart API server:**
   ```bash
   npm run dev
   ```

### Option 2: Full Clean Install

If Option 1 doesn't work:

1. **Stop the API server**

2. **Remove all node_modules:**
   ```bash
   cd apps/api
   rm -rf node_modules
   ```

3. **Reinstall everything:**
   ```bash
   npm install
   ```

4. **This should trigger postinstall which runs `prisma generate`**

5. **If postinstall fails, manually run:**
   ```bash
   npx prisma generate
   ```

6. **Restart API server:**
   ```bash
   npm run dev
   ```

### Option 3: From Monorepo Root

If the issue persists, try from the root:

```bash
cd /Users/yusaf/sai-platform
npm install
cd apps/api
npx prisma generate
npm run dev
```

## Verification

After fixing, test the login endpoint:
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@sai.com","password":"password123"}'
```

You should get a successful response with a token, not the enum conversion error.

## Database Status

✅ Database is correct:
- Enum type `UserRole` exists
- Column `role` is typed as `UserRole`
- Sample user has role `OPERATOR`

The issue is purely with the Prisma Client TypeScript types, not the database.

## If All Else Fails

If Prisma generation continues to fail, you can temporarily work around it by:

1. Using type assertions in the service code (not recommended long-term)
2. Checking for Prisma version conflicts in the monorepo
3. Ensuring Node.js version compatibility (Prisma 5.22.0 requires Node 16+)
