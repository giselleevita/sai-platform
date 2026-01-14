## RBAC & Enterprise Auth Readiness

### RBAC
- Backend routes enforce permissions via `requirePermission` middleware (see `apps/api/src/middleware/permissions.ts`).
- Pricing endpoint now requires authentication + `COMPLIANCE_READ`.
- Roles → permissions matrix lives in `Permission` enum and `rolePermissions` map; default deny if permission missing.

### MFA (TOTP + recovery codes)
- New DB fields: `mfaEnabled`, `mfaSecret`, `mfaRecoveryCodes`.
- Endpoints (all require auth):
  - `POST /api/auth/mfa/setup` → returns `{ secret, otpauthUrl, recoveryCodes }`.
  - `POST /api/auth/mfa/verify` → body `{ code }`, enables MFA after a valid TOTP.
  - `POST /api/auth/mfa/disable` → body `{ code? , recoveryCode? }`.
- Login requires a TOTP or recovery code when `mfaEnabled=true`; recovery codes are hashed and burned on use.
- Config: `MFA_ISSUER` (default `SAI Platform`), `MFA_WINDOW` (default `1` step).

### SSO (plan)
- Env placeholders added: `OIDC_ISSUER`, `OIDC_CLIENT_ID`, `OIDC_CLIENT_SECRET`, `OIDC_REDIRECT_URI`.
- Recommended flow: OIDC auth code with PKCE -> map IdP user to `User` by email + company domain; mint JWT/refresh tokens after callback.
- Tasks to wire next:
  - Add OIDC client helper (e.g., `openid-client`), initiate auth at `/api/auth/oidc/start`, handle callback at `/api/auth/oidc/callback`.
  - Enforce domain allowlist per company to prevent cross-tenant login.
  - Optionally auto-provision user role from IdP group mapping.

### Password reset / email verification (next)
- Add `PasswordResetToken` table with expiry.
- Require verified email flag before allowing login for new accounts.
- Send reset links via SMTP provider with signed, short-lived tokens.
