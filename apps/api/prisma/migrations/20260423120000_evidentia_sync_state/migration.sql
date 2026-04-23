-- Phase 0: idempotency + last-error tracking for SAI → Evidentia evidence sync

CREATE TABLE "EvidentiaSyncState" (
    "evidenceId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "evidentiaExternalId" TEXT,
    "lastPushedContentHash" TEXT,
    "lastSuccessAt" TIMESTAMP(3),
    "lastAttemptAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastError" TEXT,
    "lastHttpStatus" INTEGER,

    CONSTRAINT "EvidentiaSyncState_pkey" PRIMARY KEY ("evidenceId")
);

CREATE INDEX "EvidentiaSyncState_companyId_idx" ON "EvidentiaSyncState"("companyId");

ALTER TABLE "EvidentiaSyncState" ADD CONSTRAINT "EvidentiaSyncState_evidenceId_fkey" FOREIGN KEY ("evidenceId") REFERENCES "Evidence"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "EvidentiaSyncState" ADD CONSTRAINT "EvidentiaSyncState_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
