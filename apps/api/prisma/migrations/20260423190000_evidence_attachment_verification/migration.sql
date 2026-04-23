-- Increment 1: attachment integrity verification fields

ALTER TABLE "EvidenceAttachment"
  ADD COLUMN "lastVerifiedAt" TIMESTAMP(3),
  ADD COLUMN "invalidAt" TIMESTAMP(3),
  ADD COLUMN "lastVerifyError" TEXT;

