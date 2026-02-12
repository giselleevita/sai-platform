# SAI Platform - Enterprise AI Governance Platform

**Govern every AI decision — with accountability, risk control, and audit-ready proof.**

SAI Platform is a **production-ready, enterprise-grade** secure AI integration management system that helps organizations assess AI risk, enforce policies, and prove compliance with regulations like the EU AI Act and NIS2.

## 🎯 What It Does

SAI Platform provides comprehensive AI governance, risk management, and compliance tracking:

- **AI Tool Inventory** - Centralized registry of all AI tools with risk scoring
- **Risk Management** - Automated risk assessment with likelihood/impact analysis
- **Compliance Monitoring** - Policy enforcement, control tracking, and evidence management
- **Incident Tracking** - Complete incident lifecycle management with reporting deadlines
- **Audit Logging** - Comprehensive audit trail with activity feed
- **Report Generation** - PDF reports, Excel exports, and custom report builder
- **Governance Workflows** - Policy management, control tracking, and decision traceability

## ✨ Key Features

### Core Capabilities
- ✅ **AI Tool Inventory** - Register, categorize, and track all AI tools
- ✅ **Automated Risk Scoring** - AI-powered risk assessment with explainable factors
- ✅ **Risk Decision Management** - Accept, defer, or reject risks with management sign-off
- ✅ **Policy & Control Management** - Central registry of policies, controls, and procedures
- ✅ **Evidence Governance** - Track evidence coverage, expiry, and approval status
- ✅ **Incident Management** - Full incident lifecycle with severity classification
- ✅ **Compliance Dashboards** - Real-time compliance status and gap analysis
- ✅ **Audit Logging** - Complete audit trail with search and export capabilities

### Advanced Features
- ✅ **Activity Feed** - Real-time activity tracking across the platform
- ✅ **Comments & Discussions** - Threaded comments on tools, risks, and incidents
- ✅ **Excel Import/Export** - Bulk import tools and risks, export data for analysis
- ✅ **Webhooks** - Event-based integrations with external systems
- ✅ **Custom Fields** - Extensible data model for organization-specific metadata
- ✅ **API Documentation** - Complete OpenAPI 3.0 documentation

### Enterprise Security
- ✅ **httpOnly Cookies** - Secure token storage with CSRF protection
- ✅ **Rate Limiting** - Multi-tier rate limiting (API, auth, reports)
- ✅ **Input Validation** - Comprehensive Zod schema validation
- ✅ **RBAC** - Role-based access control with permission enforcement
- ✅ **Soft Deletes** - Recoverable deletions with audit trail
- ✅ **Structured Logging** - Request IDs and comprehensive logging

### Performance & Scalability
- ✅ **Pagination** - Efficient pagination on all list endpoints
- ✅ **Full-Text Search** - Server-side search and filtering
- ✅ **Redis Caching** - Caching strategy ready for production
- ✅ **Database Indexing** - Optimized queries with proper indexes

## 🏗️ Architecture

```
sai-platform/
├── apps/
│   ├── web/          # Next.js frontend dashboard
│   └── api/          # Node.js/Express backend
├── packages/
│   ├── shared-types/     # Shared TypeScript types
│   └── risk-scoring/     # Risk calculation algorithms
├── docs/             # Documentation
├── scripts/          # Utility scripts
└── tests/            # Test suites
```

**Tech Stack:**
- **Frontend**: Next.js 16, React, TypeScript, Tailwind CSS
- **Backend**: Node.js, Express, TypeScript, Prisma ORM
- **Database**: PostgreSQL (with Neon support)
- **Caching**: Redis (optional)
- **Authentication**: JWT with httpOnly cookies, CSRF protection
- **Validation**: Zod schemas
- **Testing**: Jest

## 🚀 Quick Start

### Prerequisites

- Node.js v20.9 or higher
- npm v9 or higher
- Docker and Docker Compose (for local database)
- Git

### Installation

```bash
# 1. Install dependencies
npm install

# 2. Run one-command local setup
npm run setup

# 3. Configure environment variables (if needed)
# apps/api/.env will be created from apps/api/env.example
# Update JWT_SECRET before sharing environments

# 4. Start development servers
npm run dev
```

Access:
- **Frontend**: http://localhost:3000
- **API**: http://localhost:3001
- **API Docs**: http://localhost:3001/api-docs

## 📚 Documentation

### Essential Guides

- **[Getting Started](docs/GETTING_STARTED.md)** - Complete setup guide (⭐ Start here)
- **[How It Works](docs/HOW_IT_WORKS.md)** - Platform overview and architecture
- **[Quick Start](docs/QUICK_START.md)** - Quick reference commands
- **[Troubleshooting](docs/TROUBLESHOOTING.md)** - Common issues and solutions

### Technical Documentation

- **[Structure](docs/STRUCTURE.md)** - Project architecture and code organization
- **[API Reference](docs/API_ROUTES_COMPLETE.md)** - Complete API endpoint documentation
- **[Deployment](docs/DEPLOYMENT.md)** - Production deployment guide
- **[CI/CD](docs/CI_CD.md)** - Continuous integration setup

All documentation is in the `docs/` directory.

## 🛠️ Development

### Common Commands

```bash
# Start all services
npm run dev

# Build all packages
npm run build

# Run tests
npm run test

# Database management
cd apps/api
npm run db:studio    # Open Prisma Studio (database GUI)
npm run db:migrate   # Run migrations
npm run db:push      # Push schema changes (dev only)
```

### Project Structure

- **Backend**: `apps/api/src/` - Express API with controllers, services, routes
- **Frontend**: `apps/web/app/` - Next.js pages and components
- **Shared**: `packages/` - Shared TypeScript types and utilities

## 📊 Platform Status

### ✅ Production Ready

- **Features**: 29/29 (100%) - All core and advanced features implemented
- **Security**: Enterprise-grade with httpOnly cookies, CSRF, rate limiting
- **Performance**: Optimized with pagination, search, and caching
- **Documentation**: Complete API docs and user guides
- **Testing**: Jest framework configured with example tests

### Key Metrics

- **Backend Services**: 20+
- **API Endpoints**: 80+
- **Frontend Pages**: 24+
- **Database Models**: 26
- **Total Files**: 100+ TypeScript files

## 🔐 Security Features

- **Authentication**: JWT tokens in httpOnly cookies with CSRF protection
- **Authorization**: Role-based access control (RBAC) with permission enforcement
- **Input Validation**: Comprehensive Zod schema validation on all endpoints
- **Rate Limiting**: Multi-tier rate limiting to prevent abuse
- **Audit Logging**: Complete audit trail for compliance
- **Data Isolation**: Company-level data isolation enforced

## 🚀 Deployment

The platform is ready for production deployment to:

- **AWS ECS Fargate** - Containerized API deployment
- **Neon Database** - Managed PostgreSQL with SSL
- **S3 + CloudFront** - Static frontend hosting (or Vercel)
- **Redis** - Optional caching layer (ElastiCache)

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for detailed deployment instructions.

## 📝 License

Private - All rights reserved

---

**Status**: ✅ **PRODUCTION READY** | **Version**: 1.0.0 | **Last Updated**: January 2026
