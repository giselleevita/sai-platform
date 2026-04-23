-- Evidentia governance + connector registry + evidence review/provenance

ALTER TABLE "Company" ADD COLUMN "evidentiaSyncEnabled" BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE "IntegrationConnector" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "config" JSONB NOT NULL DEFAULT '{}',
    "lastSyncAt" TIMESTAMP(3),
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IntegrationConnector_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "IntegrationConnector_companyId_idx" ON "IntegrationConnector"("companyId");
CREATE INDEX "IntegrationConnector_type_idx" ON "IntegrationConnector"("type");

ALTER TABLE "IntegrationConnector" ADD CONSTRAINT "IntegrationConnector_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Evidence" ADD COLUMN "externalEvidenceId" TEXT;
ALTER TABLE "Evidence" ADD COLUMN "collectionMethod" TEXT;
ALTER TABLE "Evidence" ADD COLUMN "assignedReviewerId" TEXT;
ALTER TABLE "Evidence" ADD COLUMN "reviewNote" TEXT;
ALTER TABLE "Evidence" ADD COLUMN "reviewedAt" TIMESTAMP(3);
ALTER TABLE "Evidence" ADD COLUMN "reviewedById" TEXT;

CREATE INDEX "Evidence_externalEvidenceId_idx" ON "Evidence"("externalEvidenceId");
