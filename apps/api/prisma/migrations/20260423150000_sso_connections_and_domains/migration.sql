-- Phase 2: tenant-aware OIDC (SSO connection + verified domains + group role mapping)

CREATE TABLE "SsoConnection" (
    "companyId" TEXT NOT NULL,
    "issuer" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "clientSecretRef" TEXT NOT NULL,
    "redirectUri" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SsoConnection_pkey" PRIMARY KEY ("companyId")
);

ALTER TABLE "SsoConnection" ADD CONSTRAINT "SsoConnection_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "VerifiedDomain" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "verifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VerifiedDomain_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "VerifiedDomain_companyId_domain_key" ON "VerifiedDomain"("companyId", "domain");
CREATE INDEX "VerifiedDomain_companyId_idx" ON "VerifiedDomain"("companyId");

ALTER TABLE "VerifiedDomain" ADD CONSTRAINT "VerifiedDomain_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "GroupRoleMapping" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "group" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GroupRoleMapping_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "GroupRoleMapping_companyId_group_key" ON "GroupRoleMapping"("companyId", "group");
CREATE INDEX "GroupRoleMapping_companyId_idx" ON "GroupRoleMapping"("companyId");

ALTER TABLE "GroupRoleMapping" ADD CONSTRAINT "GroupRoleMapping_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

