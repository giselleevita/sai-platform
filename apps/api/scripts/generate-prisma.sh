#!/bin/bash
# Workaround script to generate Prisma client in monorepo

cd "$(dirname "$0")/.."

# Ensure @prisma/client is installed
npm install @prisma/client@5.22.0 --save

# Generate Prisma client
export PRISMA_GENERATE_DATAPROXY=false
npx prisma generate --schema=./prisma/schema.prisma

echo "✅ Prisma client generated"
