-- CreateEnum
DO $$ BEGIN
    CREATE TYPE "MLIntegrationProvider" AS ENUM ('MLFLOW', 'SAGEMAKER', 'VERTEX_AI', 'OTHER');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- CreateEnum
DO $$ BEGIN
    CREATE TYPE "MLIntegrationStatus" AS ENUM ('ACTIVE', 'DISABLED', 'ERROR');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- CreateTable
CREATE TABLE "MLIntegration" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "provider" "MLIntegrationProvider" NOT NULL,
    "displayName" TEXT NOT NULL,
    "status" "MLIntegrationStatus" NOT NULL DEFAULT 'ACTIVE',
    "config" JSONB,
    "lastSyncedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "MLIntegration_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MLIntegration_companyId_idx" ON "MLIntegration"("companyId");

-- CreateIndex
CREATE INDEX "MLIntegration_provider_idx" ON "MLIntegration"("provider");

-- CreateIndex
CREATE INDEX "MLIntegration_status_idx" ON "MLIntegration"("status");

-- CreateIndex
CREATE INDEX "MLIntegration_deletedAt_idx" ON "MLIntegration"("deletedAt");

-- AddForeignKey
ALTER TABLE "MLIntegration" ADD CONSTRAINT "MLIntegration_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
