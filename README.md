# SAI Platform - Secure AI Integration SaaS

A comprehensive platform for managing AI tool adoption, compliance, and risk.

## Project Structure

```
sai-platform/
├── apps/
│   ├── web/          # Next.js frontend dashboard
│   ├── api/          # Node.js/Express backend
│   └── admin/        # Admin dashboard (future)
├── packages/
│   ├── shared-types/     # Shared TypeScript types
│   ├── risk-scoring/     # Risk calculation algorithms
│   ├── compliance-rules/ # Compliance rule engine (future)
│   ├── db-schemas/       # Database schemas (future)
│   └── shared-ui/        # Shared UI components (future)
├── services/         # Microservices (future)
├── tools/            # CLI tools and scripts
└── docs/             # Documentation
```

## Prerequisites

- Node.js v18 or higher
- npm v9 or higher
- Docker and Docker Compose (for local database)
- Git

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Start Local Database

```bash
docker-compose up -d
```

This starts PostgreSQL and Redis containers.

### 3. Set Up Database

```bash
cd apps/api
npm run db:generate  # Generate Prisma Client
npm run db:migrate   # Run database migrations
```

### 4. Configure Environment Variables

Create `.env` files in:
- `apps/api/.env` - API configuration (DATABASE_URL, etc.)
- `apps/web/.env.local` - Next.js configuration (if needed)

Example `apps/api/.env`:
```
PORT=3001
NODE_ENV=development
DATABASE_URL=postgresql://sai_user:sai_password@localhost:5432/sai_db
```

### 5. Start Development Servers

From the root directory:

```bash
npm run dev
```

This starts:
- Frontend: http://localhost:3000
- API: http://localhost:3001

## Development Commands

### Root Level

```bash
npm run dev      # Start all apps in dev mode
npm run build    # Build all apps and packages
npm run test     # Run all tests
npm run lint     # Lint all code
```

### Individual Apps

```bash
# Frontend
cd apps/web
npm run dev
npm run build

# Backend
cd apps/api
npm run dev
npm run build
npm run db:studio  # Open Prisma Studio
```

## Database Management

```bash
cd apps/api

# Generate Prisma Client
npm run db:generate

# Create and apply migrations
npm run db:migrate

# Push schema changes (dev only)
npm run db:push

# Open Prisma Studio (database GUI)
npm run db:studio
```

## Project Status

### ✅ Completed
- Monorepo setup with Turborepo
- Next.js frontend with TypeScript and Tailwind
- Express backend with TypeScript
- Shared types package
- Risk scoring package
- Docker Compose for local development
- Prisma setup with User and Company models

### 🚧 In Progress
- API routes for inventory management
- Frontend dashboard pages
- Authentication system

### 📋 Planned
- Multi-tenant support
- Billing integration
- Compliance rule engine
- Email notifications
- Integration services

## Development Timeline

- **MVP (Weeks 1-8)**: Inventory + risk scoring + policies (~120 hours)
- **Beta (Weeks 9-12)**: Multi-tenant, billing, polish (~80 hours)
- **Total**: ~200 hours (10 weeks part-time)

## 📚 Documentation

### Quick Links

- **[Getting Started](docs/GETTING_STARTED.md)** - Complete setup guide (⭐ Start here)
- **[How It Works](docs/HOW_IT_WORKS.md)** - Platform overview and architecture
- **[Quick Start](docs/QUICK_START.md)** - Quick reference commands
- **[Troubleshooting](docs/TROUBLESHOOTING.md)** - Common issues and solutions

### Full Documentation Index

See [docs/README.md](docs/README.md) for complete documentation:
- Setup and installation guides
- Architecture and structure  
- API reference
- Testing guides
- Troubleshooting


## License

Private - All rights reserved
