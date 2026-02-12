# Troubleshooting Guide

## 🐳 Docker Not Running

### Error Message
```
docker.errors.DockerException: Error while fetching server API version: 
('Connection aborted.', FileNotFoundError(2, 'No such file or directory'))
```

### Solution 1: Start Docker Desktop (macOS/Windows)

**macOS:**
1. Open Docker Desktop application
2. Wait for Docker to start (whale icon in menu bar)
3. Verify: `docker ps` should work

**Windows:**
1. Open Docker Desktop application
2. Wait for Docker to start
3. Verify: `docker ps` should work

**Linux:**
```bash
# Start Docker service
sudo systemctl start docker

# Enable Docker to start on boot
sudo systemctl enable docker

# Verify
docker ps
```

### Solution 2: Check Docker Status

```bash
# Check if Docker is running
docker ps

# If error, try:
docker info

# Check Docker Desktop status (macOS)
open -a Docker

# Check Docker service (Linux)
sudo systemctl status docker
```

### Solution 3: Alternative - Use External Database

If Docker isn't available, you can use an external PostgreSQL database:

**Update `apps/api/.env`:**
```env
DATABASE_URL="postgresql://user:password@your-database-host:5432/sai_db"
```

Then skip `docker-compose up -d postgres` and just run migrations.

---

## 🔧 Other Common Issues

### Port Already in Use

**Error:** `EADDRINUSE: address already in use`

**Solution:**
```bash
# Find what's using the port
lsof -i :3000  # Frontend
lsof -i :3001  # Backend
lsof -i :5432  # Database

# Kill the process
kill -9 <PID>

# Or change ports in:
# - apps/api/.env (PORT=3001)
# - apps/web/package.json (dev script)
```

### Prisma Migration Errors

**Error:** `Can't reach database server`

**Solution:**
```bash
# 1. Make sure database is running
docker-compose ps

# 2. Wait a few seconds for database to initialize
sleep 5

# 3. Try migration again
cd apps/api
npx prisma migrate dev --name init
```

### Prisma Client Not Generated

**Error:** `Module not found: @prisma/client`

**Solution:**
```bash
cd apps/api
npx prisma generate
```

### Module Not Found Errors

**Error:** `Cannot find module '@sai/...'`

**Solution:**
```bash
# Install all dependencies
npm install

# Build shared packages
npm run build
```

### Environment Variables Missing

**Error:** `JWT_SECRET is not defined`

**Solution:**
```bash
# Check if .env files exist
ls apps/api/.env
ls apps/web/.env.local

# Create if missing (see SETUP_GUIDE.md)
```

---

## ✅ Verification Checklist

Before starting, verify:

- [ ] Docker Desktop is running (or Docker service on Linux)
- [ ] Node.js v20.9+ installed (`node --version`)
- [ ] npm v9+ installed (`npm --version`)
- [ ] Dependencies installed (`npm install`)
- [ ] Environment files exist (`apps/api/.env`, `apps/web/.env.local`)

---

## 🆘 Still Having Issues?

1. **Check Docker:**
   ```bash
   docker --version
   docker ps
   ```

2. **Check Node:**
   ```bash
   node --version  # Should be v20.9+
   npm --version   # Should be v9+
   ```

3. **Check Dependencies:**
   ```bash
   npm install
   npm run build
   ```

4. **Check Logs:**
   ```bash
   # Docker logs
   docker-compose logs postgres
   
   # API logs (when running)
   # Check terminal output
   ```

---

## 📞 Quick Fixes

### Reset Everything
```bash
# Stop everything
docker-compose down

# Remove volumes (WARNING: deletes data)
docker-compose down -v

# Reinstall dependencies
rm -rf node_modules apps/*/node_modules packages/*/node_modules
npm install

# Start fresh
docker-compose up -d postgres
cd apps/api && npx prisma migrate dev --name init && cd ../..
npm run dev
```

---

**See `START_PROJECT.md` for normal startup instructions.**
