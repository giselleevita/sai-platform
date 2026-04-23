-- Phase 4: evidence attachments (local storage path + integrity hash)

CREATE TABLE "EvidenceAttachment" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "evidenceId" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "sha256" TEXT NOT NULL,
    "storagePath" TEXT NOT NULL,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EvidenceAttachment_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "EvidenceAttachment_companyId_idx" ON "EvidenceAttachment"("companyId");
CREATE INDEX "EvidenceAttachment_evidenceId_idx" ON "EvidenceAttachment"("evidenceId");

ALTER TABLE "EvidenceAttachment" ADD CONSTRAINT "EvidenceAttachment_evidenceId_fkey" FOREIGN KEY ("evidenceId") REFERENCES "Evidence"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EvidenceAttachment" ADD CONSTRAINT "EvidenceAttachment_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EvidenceAttachment" ADD CONSTRAINT "EvidenceAttachment_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

