# Getting Started with SAI Platform

Complete guide to set up and start using the SAI Platform.

## 📋 Prerequisites

Before you begin, ensure you have:

- **Node.js** v20.9 or higher ([Download](https://nodejs.org/))
- **npm** v9 or higher (comes with Node.js)
- **Docker Desktop** ([Download](https://www.docker.com/products/docker-desktop))
- **Git** ([Download](https://git-scm.com/))

### Verify Installation

```bash
node --version    # Should be v20.9+
npm --version     # Should be v9+
docker --version  # Should be installed
git --version     # Should be installed
```

---

## 🚀 Quick Setup (5 minutes)

### Option 1: Automated Setup

```bash
# Run the setup script
./scripts/setup.sh
```

### Option 2: Manual Setup

Follow the steps below.

---

## 📦 Step-by-Step Setup

### Step 1: Install Dependencies

```bash
# From the project root
npm install
```

This installs dependencies for all apps and packages in the monorepo.

### Step 2: Start Database

**Important**: Make sure Docker Desktop is running first!

```bash
# Start PostgreSQL database
docker-compose up -d postgres

# Wait a few seconds for database to initialize
# Verify it's running:
docker-compose ps
```

You should see the `postgres` container running.

### Step 3: Configure Environment Variables

#### Backend Configuration (`apps/api/.env`)

Create or update `apps/api/.env`:

```bash
# Database
DATABASE_URL="postgresql://sai_user:sai_password@localhost:5432/sai_db"

# JWT (CHANGE THIS IN PRODUCTION!)
JWT_SECRET="sai-platform-super-secret-jwt-key-2026-change-me-now"
JWT_EXPIRY="7d"

# Server
PORT=3001
NODE_ENV=development

# CORS
FRONTEND_URL=http://localhost:3000
```

#### Frontend Configuration (`apps/web/.env.local`)

Create or update `apps/web/.env.local`:

```bash
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### Step 4: Run Database Migrations

```bash
# Navigate to API directory
cd apps/api

# Run migrations (creates database tables)
npx prisma migrate dev --name init-sai-platform

# Generate Prisma Client
npx prisma generate

# Return to root
cd ../..
```

**Expected Output:**
```
✅ Migration completed
✅ Prisma Client generated
```

### Step 5: Start Development Servers

```bash
# From project root
npm run dev
```

This starts:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001

**Expected Output:**
```
✔ web:dev running on http://localhost:3000
✔ api:dev running on http://localhost:3001
✅ SAI API server running on http://localhost:3001
```

---

## ✅ Verify Installation

### 1. Check Database

```bash
docker-compose ps
```

Should show `postgres` container as "Up".

### 2. Check API Health

```bash
curl http://localhost:3001/health
```

Should return:
```json
{"status":"ok","timestamp":"2025-01-08T..."}
```

### 3. Check Frontend

Open http://localhost:3000 in your browser.

You should see the SAI Platform landing page.

---

## 🎯 First Steps

### 1. Create an Account

1. Go to http://localhost:3000/auth/signup
2. Fill in the form:
   - Email: `test@sai.com`
   - Password: `Password123` (or your choice)
   - Name, Company Name, etc.
3. Click "Sign Up"

### 2. Add Your First AI Tool

1. After signup, you'll be redirected to the dashboard
2. Click "Add Tool" button
3. Fill in tool information:
   - Name: `ChatGPT`
   - Category: `LLM`
   - Data Types: Select `PII` and `Financial`
   - Users: `25`
   - Frequency: `Daily`
   - Controls: Select `MFA`
4. Click "Add Tool"

The system will automatically calculate a risk score!

### 3. Explore the Dashboard

- View risk summary cards
- See your tools in the inventory
- Filter and sort tools
- View detailed tool information

---

## 🛠️ Development Commands

### Root Level Commands

```bash
npm run dev      # Start all apps in development mode
npm run build    # Build all apps and packages
npm run lint     # Lint all code
npm run test     # Run all tests (when implemented)
```

### Individual App Commands

```bash
# Frontend
cd apps/web
npm run dev      # Start Next.js dev server
npm run build    # Build for production

# Backend
cd apps/api
npm run dev      # Start Express server
npm run build    # Build TypeScript
npm run db:studio # Open Prisma Studio (database GUI)
```

### Database Commands

```bash
cd apps/api

# Generate Prisma Client
npx prisma generate

# Create new migration
npx prisma migrate dev --name migration-name

# Push schema changes (dev only)
npx prisma db push

# Open Prisma Studio
npx prisma studio
```

---

## 🐛 Troubleshooting

### Database Connection Issues

**Problem**: `Can't reach database server at localhost:5432`

**Solution**:
1. Check Docker is running: `docker ps`
2. Start database: `docker-compose up -d postgres`
3. Wait 10 seconds for database to initialize
4. Try again

### Port Already in Use

**Problem**: `Port 3000 or 3001 already in use`

**Solution**:
```bash
# Find process using port
lsof -i :3000
lsof -i :3001

# Kill process (replace PID with actual process ID)
kill -9 <PID>
```

### Prisma Migration Errors

**Problem**: `Migration failed` or `schema.prisma: file not found`

**Solution**:
1. Make sure you're in `apps/api` directory
2. Check `prisma/schema.prisma` exists
3. Run: `npx prisma migrate reset` (⚠️ deletes all data)
4. Then: `npx prisma migrate dev --name init`

### Frontend Not Loading

**Problem**: Blank page or errors in browser console

**Solution**:
1. Check API is running: `curl http://localhost:3001/health`
2. Check `.env.local` has `NEXT_PUBLIC_API_URL`
3. Clear browser cache
4. Restart dev server: `npm run dev`

For more troubleshooting, see [TROUBLESHOOTING.md](./TROUBLESHOOTING.md).

---

## 📚 Next Steps

1. **Read Documentation**:
   - [HOW_IT_WORKS.md](./HOW_IT_WORKS.md) - Understand the platform
   - [STRUCTURE.md](./STRUCTURE.md) - Learn the architecture
   - [API_ROUTES_COMPLETE.md](./API_ROUTES_COMPLETE.md) - API reference

2. **Explore Features**:
   - Add multiple AI tools
   - View risk summaries
   - Filter and sort inventory
   - Check compliance policies

3. **Development**:
   - Review code structure
   - Run tests
   - Contribute improvements

---

## 🆘 Need Help?

- Check [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) for common issues
- Review [HOW_IT_WORKS.md](./HOW_IT_WORKS.md) for platform understanding
- See [API_ROUTES_COMPLETE.md](./API_ROUTES_COMPLETE.md) for API details

---

**Last Updated**: 2025-01-08
