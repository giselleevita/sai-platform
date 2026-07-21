# SAI Platform

> **Portfolio note:** Supporting repository. Featured evidence API in the public stack is [proofrail-evidence-api](https://github.com/giselleevita/proofrail-evidence-api). Flagship enforcement repo: [agent-security-gate](https://github.com/giselleevita/agent-security-gate).

[![Quality Gate](https://github.com/giselleevita/sai-platform/actions/workflows/ci.yml/badge.svg)](https://github.com/giselleevita/sai-platform/actions/workflows/ci.yml)
[![Security Checks](https://github.com/giselleevita/sai-platform/actions/workflows/security.yml/badge.svg)](https://github.com/giselleevita/sai-platform/actions/workflows/security.yml)

SAI Platform is a full-stack reference implementation for assessing AI risk, enforcing governance workflows, and producing audit-oriented evidence for regulations such as the EU AI Act and NIS2.

It demonstrates a Next.js and Express/Prisma architecture with company-scoped data,
governance workflows, security controls, and a reproducible clean-database deployment path.
It is not a certified compliance product and requires independent review before production
use.

## What It Does

- **AI Tool Inventory** - Centralized registry of all AI tools with risk scoring
- **Risk Management** - Automated risk assessment with likelihood/impact analysis
- **Compliance Monitoring** - Policy enforcement, control tracking, and evidence management
- **Incident Tracking** - Complete incident lifecycle management with reporting deadlines
- **Audit Logging** - Comprehensive audit trail with activity feed
- **Report Generation** - PDF reports, Excel exports, and custom report builder
- **Governance Workflows** - Policy management, control tracking, and decision traceability

## Key Features

### Core Capabilities
- **AI Tool Inventory** - Register, categorize, and track AI tools
- **Explainable Risk Scoring** - Calculate risk from documented factors
- **Risk Decision Management** - Accept, defer, or reject risks with sign-off records
- **Policy & Control Management** - Manage policies, controls, and procedures
- **Evidence Governance** - Track evidence coverage, expiry, and approval status
- **Incident Management** - Manage incident lifecycle and severity
- **Compliance Dashboards** - Review compliance status and gaps
- **Audit Logging** - Search and export activity records

### Advanced Features
- **Activity Feed** - Activity tracking across the platform
- **Comments & Discussions** - Threaded comments on tools, risks, and incidents
- **Excel Import/Export** - Bulk import tools and risks and export data
- **Webhooks** - Event-based integrations with external systems
- **Custom Fields** - Extensible organization-specific metadata
- **API Documentation** - OpenAPI documentation

### Security Controls
- **httpOnly Cookies and CSRF Protection**
- **Rate Limiting and Zod Input Validation**
- **Role-Based Access Control**
- **Soft Deletes and Structured Audit Logging**

## Architecture

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

## Quick Start

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

## Documentation

### Essential Guides

- **[Getting Started](docs/GETTING_STARTED.md)** - Complete setup guide
- **[How It Works](docs/HOW_IT_WORKS.md)** - Platform overview and architecture
- **[Quick Start](docs/QUICK_START.md)** - Quick reference commands
- **[Troubleshooting](docs/TROUBLESHOOTING.md)** - Common issues and solutions

### Technical Documentation

- **[Structure](docs/STRUCTURE.md)** - Project architecture and code organization
- **[API Reference](docs/API_ROUTES_COMPLETE.md)** - Complete API endpoint documentation
- **[Deployment](docs/DEPLOYMENT.md)** - Production deployment guide
- **[CI/CD](docs/CI_CD.md)** - Continuous integration setup
- **[MVP Release Notes](docs/RELEASE_NOTES_MVP.md)** - Delivered scope, known limits, and rollback notes

All documentation is in the `docs/` directory.

## Development

### CI (GitHub Actions)

Pull requests and pushes to `main` run **Quality Gate** (workspace build, `npm test`, CSRF security gate) and **Sprint smoke** (Postgres service, `build:api`, `test:sprint`). To keep `main` healthy, enable **branch protection** in the repository settings: require both jobs **Build + Test (Node 20)** and **Sprint smoke (API + Postgres)** as required status checks before merge.

### Common Commands

```bash
# Start all services
npm run dev

# Build all packages
npm run build

# Run tests
npm run test

# Run core MVP end-to-end smoke flow
npm run test:mvp

# Run CSRF/auth behavior smoke flow
npm run test:csrf

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

## Platform Status

### Implemented Scope

- Core inventory, risk, control, evidence, incident, and reporting workflows are implemented.
- CI validates workspace builds, tests, CSRF behavior, clean PostgreSQL migrations, and both Docker images.
- Test coverage remains incomplete across the full API and UI surface.
- See [MVP Release Notes](docs/RELEASE_NOTES_MVP.md) for delivered scope and known limits.

## Security Features

- **Authentication**: JWT tokens in httpOnly cookies with CSRF protection
- **Authorization**: Role-based access control (RBAC) with permission enforcement
- **Input Validation**: Zod schema validation on covered endpoints
- **Rate Limiting**: Multi-tier rate limiting to prevent abuse
- **Audit Logging**: Activity records for governance workflows
- **Data Isolation**: Company-scoped data access patterns

## Deployment

The repository includes deployment patterns for:

- **AWS ECS Fargate** - Containerized API deployment
- **Neon Database** - Managed PostgreSQL with SSL
- **S3 + CloudFront** - Static frontend hosting (or Vercel)
- **Redis** - Optional caching layer (ElastiCache)

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for detailed deployment instructions.

## License

Apache-2.0 - see [LICENSE](LICENSE) for details.

---

**Status**: Reference implementation | **Version**: 1.0.0
