-- Phase 1: tenant-scoped Evidentia credentials (no secrets stored in DB)

CREATE TYPE "EvidentiaAuthMode" AS ENUM ('STATIC_JWT_ENVREF');

CREATE TABLE "CompanyEvidentiaLink" (
    "companyId" TEXT NOT NULL,
    "evidentiaTenantId" TEXT NOT NULL,
    "authMode" "EvidentiaAuthMode" NOT NULL DEFAULT 'STATIC_JWT_ENVREF',
    "secretRef" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompanyEvidentiaLink_pkey" PRIMARY KEY ("companyId")
);

ALTER TABLE "CompanyEvidentiaLink" ADD CONSTRAINT "CompanyEvidentiaLink_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

