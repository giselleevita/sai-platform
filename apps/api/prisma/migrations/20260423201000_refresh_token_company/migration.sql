-- Tenant-stable refresh tokens: bind refresh tokens to company context

ALTER TABLE "RefreshToken"
  ADD COLUMN "companyId" TEXT;

CREATE INDEX "RefreshToken_companyId_idx" ON "RefreshToken"("companyId");

UPDATE "RefreshToken" rt
SET "companyId" = u."companyId"
FROM "User" u
WHERE rt."userId" = u."id"
  AND rt."companyId" IS NULL;

