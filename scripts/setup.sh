#!/bin/bash

set -e

echo "🚀 SAI Platform Setup Script"
echo "============================"
echo ""

# Check Docker
echo "📦 Checking Docker..."
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

if ! docker ps &> /dev/null; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi
echo "✅ Docker is running"

# Detect docker compose command variant
if command -v docker-compose &> /dev/null; then
    COMPOSE_CMD=(docker-compose)
elif docker compose version &> /dev/null; then
    COMPOSE_CMD=(docker compose)
else
    echo "❌ Docker Compose is not available. Install docker-compose or enable 'docker compose'."
    exit 1
fi
echo "✅ Using compose command: ${COMPOSE_CMD[*]}"

# Start database
echo ""
echo "🗄️  Starting database..."
cd "$(dirname "$0")/.."
"${COMPOSE_CMD[@]}" up -d postgres

# Wait for database to be ready
echo "⏳ Waiting for database to be ready..."
sleep 5

# Check database connection
until "${COMPOSE_CMD[@]}" exec -T postgres pg_isready -U sai_user > /dev/null 2>&1; do
    echo "   Still waiting..."
    sleep 2
done
echo "✅ Database is ready"

# Install dependencies (only if needed)
echo ""
if [ ! -d "node_modules" ]; then
    echo "📥 Installing dependencies..."
    npm install
else
    echo "📥 Dependencies already installed (skipping npm install)"
fi

# Ensure API environment file exists
if [ ! -f "apps/api/.env" ]; then
    cp apps/api/env.example apps/api/.env
    echo "✅ Created apps/api/.env from env.example"
fi

# Run migrations
echo ""
echo "🔄 Running database migrations..."
cd apps/api
echo "   Applying committed Prisma migrations (idempotent)..."
npx prisma migrate deploy
npx prisma generate
cd ../..

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Set a strong JWT secret in apps/api/.env"
echo "2. Start the development servers: npm run dev"
echo "3. Test the API: curl http://localhost:3001/health"
echo "4. Open the frontend: http://localhost:3000"
echo ""
