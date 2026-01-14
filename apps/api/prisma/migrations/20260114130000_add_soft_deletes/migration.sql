-- AlterTable
ALTER TABLE "AITool" ADD COLUMN "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Risk" ADD COLUMN "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Incident" ADD COLUMN "deletedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "AITool_deletedAt_idx" ON "AITool"("deletedAt");

-- CreateIndex
CREATE INDEX "Risk_deletedAt_idx" ON "Risk"("deletedAt");

-- CreateIndex
CREATE INDEX "Incident_deletedAt_idx" ON "Incident"("deletedAt");
