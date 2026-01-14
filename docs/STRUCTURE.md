# Project Structure

This document describes the improved structure of the SAI Platform monorepo.

## Overview

The project follows a clean architecture pattern with clear separation of concerns:

```
sai-platform/
├── apps/              # Applications
│   ├── api/          # Express backend
│   └── web/          # Next.js frontend
├── packages/         # Shared packages
│   ├── shared-types/ # TypeScript types
│   └── risk-scoring/ # Risk algorithms
├── docs/             # Documentation
├── scripts/          # Utility scripts
└── tests/            # Test suites
```

## Backend Structure (`apps/api/src/`)

```
apps/api/src/
├── config/          # Configuration management
├── controllers/     # HTTP request handlers
│   └── index.ts     # Barrel export
├── errors/          # Custom error classes
│   └── index.ts     # Barrel export
├── middleware/      # Request processing (auth, error handling)
│   └── index.ts     # Barrel export
├── routes/          # API endpoint definitions
│   └── index.ts     # Barrel export
├── services/        # Business logic layer
│   └── index.ts     # Barrel export
├── utils/           # Utility functions
│   └── index.ts     # Barrel export
└── validation/      # Input validation (validators + schemas)
    └── index.ts     # Barrel export
```

### Controllers (`controllers/`)
- **Purpose**: Handle HTTP requests/responses
- **Pattern**: One controller per resource
- **Example**: `inventory.controller.ts`
- **Responsibilities**:
  - Extract data from requests
  - Call service methods
  - Format responses
  - Handle errors (throw AppError)

### Services (`services/`)
- **Purpose**: Business logic layer
- **Pattern**: One service per domain
- **Example**: `ai-tool.service.ts`, `auth.service.ts`
- **Responsibilities**:
  - Business logic
  - Database operations (via Prisma)
  - Data transformations
  - No HTTP concerns

### Routes (`routes/`)
- **Purpose**: Define API endpoints
- **Pattern**: One router per resource
- **Example**: `inventory.ts`
- **Responsibilities**:
  - Define routes
  - Apply middleware
  - Connect controllers
  - Use `asyncHandler` for error handling

### Middleware (`middleware/`)
- **Purpose**: Request processing
- **Files**:
  - `auth.ts` - Authentication & authorization
  - `errorHandler.ts` - Global error handling
- **Responsibilities**:
  - Authentication
  - Request validation
  - Error handling
  - Logging

### Utils (`utils/`)
- **Purpose**: Utility functions
- **Files**:
  - `logger.ts` - Structured logging
  - `asyncHandler.ts` - Async route wrapper
- **Responsibilities**:
  - Reusable utilities
  - Helper functions
  - No business logic

### Errors (`errors/`)
- **Purpose**: Custom error classes
- **File**: `AppError.ts`
- **Classes**:
  - `AppError` - Base error class
  - `NotFoundError` - 404 errors
  - `BadRequestError` - 400 errors
  - `UnauthorizedError` - 401 errors
  - `ValidationError` - Validation errors

### Config (`config/`)
- **Purpose**: Configuration management
- **File**: `index.ts`
- **Responsibilities**:
  - Centralize configuration
  - Environment variable handling
  - Type-safe config access

### Validation (`validation/`)
- **Purpose**: Input validation and schemas
- **Files**:
  - `auth.validator.ts` - Auth validation
  - `tool-validation.ts` - Tool validation
- **Responsibilities**:
  - Input validation
  - Schema definitions
  - Validation utilities

## Frontend Structure (`apps/web/`)

### Pages (`app/`)
- **Purpose**: Next.js App Router pages
- **Structure**: Route-based file system
- **Example**: `app/inventory/page.tsx`
- **Responsibilities**:
  - Page components
  - Route definitions
  - Page-level data fetching

### Components (`components/`)
- **Purpose**: Reusable UI components
- **Structure**:
  ```
  components/
  ├── shared/        # Shared/common components
  │   ├── ErrorAlert.tsx
  │   ├── LoadingSpinner.tsx
  │   ├── RiskBadge.tsx
  │   └── index.ts   # Barrel export
  ├── inventory/    # Inventory-specific components (future)
  └── governance/    # Governance-specific components (future)
  ```
- **Responsibilities**:
  - Presentational components
  - Reusable UI elements
  - No business logic

### Hooks (`hooks/`)
- **Purpose**: Custom React hooks
- **Files**:
  - `useAuth.ts` - Authentication hook
  - `useClientOnly.ts` - Client-only rendering hook
  - `index.ts` - Barrel export
- **Responsibilities**:
  - Reusable state logic
  - Side effects
  - Data fetching patterns

### Lib (`lib/`)
- **Purpose**: Utility libraries
- **Files**:
  - `api.ts` - API client
  - `utils.ts` - Helper functions
  - `index.ts` - Barrel export
- **Responsibilities**:
  - API communication
  - Utility functions
  - No React-specific code

### Components (`components/`)
- **Purpose**: Reusable UI components
- **Structure**:
  - `shared/` - Shared components (ErrorAlert, LoadingSpinner, RiskBadge)
  - `inventory/` - Inventory-specific components (future)
  - `governance/` - Governance-specific components (future)
- **Files**:
  - `shared/index.ts` - Barrel export for shared components
- **Responsibilities**:
  - Presentational components
  - Reusable UI elements
  - No business logic

### Constants (`constants/`)
- **Purpose**: Application constants
- **File**: `index.ts`
- **Content**:
  - Categories, data types, frequencies
  - Control types
  - Risk levels
  - Type definitions

### Types (`types/`)
- **Purpose**: TypeScript type definitions
- **Usage**: Frontend-specific types

## Shared Packages (`packages/`)

### `@sai/shared-types`
- **Purpose**: Shared TypeScript types
- **Usage**: Used by both frontend and backend
- **Location**: `packages/shared-types/src/index.ts`

### `@sai/risk-scoring`
- **Purpose**: Risk calculation algorithms
- **Usage**: Used by backend services
- **Location**: `packages/risk-scoring/src/index.ts`

## Best Practices

### Backend
1. **Controllers** should be thin - delegate to services
2. **Services** contain all business logic
3. **Routes** only define endpoints and middleware
4. **Errors** use custom error classes
5. **Config** centralizes all configuration
6. **Utils** are pure functions
7. **Barrel exports** - Use index.ts files for cleaner imports
8. **Import organization** - Prefer barrel exports over direct file imports

### Frontend
1. **Pages** are route handlers
2. **Components** are reusable and presentational
3. **Hooks** encapsulate stateful logic
4. **Lib** contains utilities and API client
5. **Constants** define application constants
6. **Types** are frontend-specific

### General
1. **Separation of concerns** - Each layer has clear responsibility
2. **Type safety** - Use TypeScript throughout
3. **Error handling** - Consistent error patterns
4. **Code reuse** - Extract common patterns
5. **Documentation** - Document complex logic

## File Naming Conventions

- **Controllers**: `*.controller.ts`
- **Services**: `*.service.ts`
- **Routes**: `*.ts` (resource name)
- **Components**: `PascalCase.tsx`
- **Hooks**: `use*.ts`
- **Utils**: `*.ts` (lowercase)
- **Types**: `*.ts` (lowercase)

## Adding New Features

### Backend
1. Create service method in appropriate service
2. Create controller method
3. Add route in router
4. Add error handling
5. Add validation if needed

### Frontend
1. Create page component (if new route)
2. Create reusable components (if needed)
3. Add API calls in `lib/api.ts`
4. Add constants (if needed)
5. Add types (if needed)

## Migration Notes

The structure has been improved from the original:
- ✅ Added controllers layer (separated from routes)
- ✅ Added error handling system
- ✅ Added configuration management
- ✅ Added logging utility
- ✅ Added frontend components
- ✅ Added frontend hooks
- ✅ Added frontend utilities
- ✅ Added constants management
