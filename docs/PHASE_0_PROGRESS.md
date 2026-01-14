# Phase 0.1 - RBAC Enforcement Progress

## ✅ Completed

### 1. Permission System Created
- **File**: `apps/api/src/middleware/permissions.ts`
- **Permission Enum**: 40+ permissions covering all operations
- **Role Mapping**: Complete permission matrix for all 4 roles:
  - `MANAGEMENT`: Full access (all permissions)
  - `ADMIN`: Full operational access
  - `OPERATOR`: Read + limited write (no delete/approve)
  - `AUDITOR`: Read-only + evidence approval

### 2. Middleware Implemented
- `requirePermission(permission)` - Require single permission
- `requireAnyPermission(...permissions)` - Require any of the permissions
- `requireAllPermissions(...permissions)` - Require all permissions
- All middleware returns:
  - `401` if unauthenticated
  - `403` if authenticated but missing permission

### 3. Routes Updated
All routes now use permission-based RBAC:

- ✅ **Inventory** (`/api/inventory`)
  - `GET /` → `TOOL_READ`
  - `GET /summary` → `TOOL_READ`
  - `GET /export/csv` → `TOOL_EXPORT`
  - `GET /:id` → `TOOL_READ`
  - `POST /` → `TOOL_WRITE`
  - `PATCH /:id` → `TOOL_WRITE`
  - `DELETE /:id` → `TOOL_DELETE`

- ✅ **Governance** (`/api/governance`)
  - Policies: `POLICY_READ`, `POLICY_WRITE`, `POLICY_DELETE`
  - Controls: `CONTROL_READ`, `CONTROL_WRITE`, `CONTROL_DELETE`
  - Procedures: `PROCEDURE_READ`, `PROCEDURE_WRITE`
  - Regulations: `REGULATION_READ`, `REGULATION_WRITE`

- ✅ **Risks** (`/api/risks`)
  - `GET /` → `RISK_READ`
  - `POST /` → `RISK_WRITE`
  - `PATCH /:id` → `RISK_WRITE`
  - `DELETE /:id` → `RISK_DELETE`
  - `POST /:id/decisions` → `RISK_DECISION`

- ✅ **Evidence** (`/api/evidence`)
  - `GET /` → `EVIDENCE_READ`
  - `POST /` → `EVIDENCE_WRITE`
  - `PATCH /:id` → `EVIDENCE_WRITE`
  - `DELETE /:id` → `EVIDENCE_DELETE`

- ✅ **Incidents** (`/api/incidents`)
  - `GET /` → `INCIDENT_READ`
  - `POST /` → `INCIDENT_WRITE`
  - `PATCH /:id` → `INCIDENT_WRITE`
  - `DELETE /:id` → `INCIDENT_DELETE`

- ✅ **Audit** (`/api/audit`)
  - `GET /` → `AUDITLOG_READ`

- ✅ **Exceptions** (`/api/exceptions`)
  - `GET /` → `EXCEPTION_READ`
  - `POST /` → `EXCEPTION_WRITE`
  - `PATCH /:id` → `EXCEPTION_APPROVE`

- ✅ **Vendors** (`/api/vendors`)
  - `GET /` → `VENDOR_READ`
  - `POST /` → `VENDOR_WRITE`
  - `PATCH /:id` → `VENDOR_WRITE`
  - `DELETE /:id` → `VENDOR_DELETE`

### 4. Barrel Exports Updated
- Added permissions exports to `apps/api/src/middleware/index.ts`

## 📋 Permission Matrix

| Permission | MANAGEMENT | ADMIN | OPERATOR | AUDITOR |
|------------|-----------|-------|----------|---------|
| TOOL_READ | ✅ | ✅ | ✅ | ✅ |
| TOOL_WRITE | ✅ | ✅ | ✅ | ❌ |
| TOOL_DELETE | ✅ | ✅ | ❌ | ❌ |
| TOOL_EXPORT | ✅ | ✅ | ✅ | ✅ |
| POLICY_READ | ✅ | ✅ | ✅ | ✅ |
| POLICY_WRITE | ✅ | ✅ | ❌ | ❌ |
| POLICY_DELETE | ✅ | ✅ | ❌ | ❌ |
| CONTROL_READ | ✅ | ✅ | ✅ | ✅ |
| CONTROL_WRITE | ✅ | ✅ | ❌ | ❌ |
| CONTROL_APPROVE | ✅ | ✅ | ❌ | ❌ |
| CONTROL_DELETE | ✅ | ✅ | ❌ | ❌ |
| RISK_READ | ✅ | ✅ | ✅ | ✅ |
| RISK_WRITE | ✅ | ✅ | ✅ | ❌ |
| RISK_DECISION | ✅ | ✅ | ❌ | ❌ |
| RISK_DELETE | ✅ | ✅ | ❌ | ❌ |
| EVIDENCE_READ | ✅ | ✅ | ✅ | ✅ |
| EVIDENCE_WRITE | ✅ | ✅ | ✅ | ❌ |
| EVIDENCE_APPROVE | ✅ | ✅ | ❌ | ✅ |
| EVIDENCE_DELETE | ✅ | ✅ | ❌ | ❌ |
| INCIDENT_READ | ✅ | ✅ | ✅ | ✅ |
| INCIDENT_WRITE | ✅ | ✅ | ✅ | ❌ |
| INCIDENT_DELETE | ✅ | ✅ | ❌ | ❌ |
| AUDITLOG_READ | ✅ | ✅ | ❌ | ✅ |
| AUDITLOG_EXPORT | ✅ | ✅ | ❌ | ✅ |
| EXCEPTION_APPROVE | ✅ | ✅ | ❌ | ❌ |

## ⏳ Remaining Tasks

### 0.1.6 - RBAC Unit Tests
- [ ] Create test suite for permission middleware
- [ ] Test 401 responses (unauthenticated)
- [ ] Test 403 responses (missing permission)
- [ ] Test permission matrix for each role
- [ ] Integration tests for each route group

## 🎯 Next Steps

1. **Add RBAC Tests** (0.1.6)
2. **Frontend RBAC** - Hide restricted routes/buttons based on permissions
3. **Phase 1.1** - Governance UI implementation

## 📝 Notes

- Auth routes (`/api/auth/*`) remain public (signup/login) or use `authMiddleware` only (me, refresh, logout)
- All other routes now require explicit permissions
- The old `requireRoles` middleware is still available for backward compatibility but should be replaced
- Permission system is extensible - new permissions can be added easily
