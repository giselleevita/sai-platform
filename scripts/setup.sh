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

# Start database
echo ""
echo "🗄️  Starting database..."
cd "$(dirname "$0")/.."
docker-compose up -d postgres

# Wait for database to be ready
echo "⏳ Waiting for database to be ready..."
sleep 5

# Check database connection
until docker-compose exec -T postgres pg_isready -U sai_user > /dev/null 2>&1; do
    echo "   Still waiting..."
    sleep 2
done
echo "✅ Database is ready"

# Install dependencies
echo ""
echo "📥 Installing dependencies..."
npm install

# Run migrations
echo ""
echo "🔄 Running database migrations..."
cd apps/api
npx prisma migrate dev --name init-sai-platform
npx prisma generate
cd ../..

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Start the development servers: npm run dev"
echo "2. Test the API: curl http://localhost:3001/health"
echo "3. Open the frontend: http://localhost:3000"
echo ""
