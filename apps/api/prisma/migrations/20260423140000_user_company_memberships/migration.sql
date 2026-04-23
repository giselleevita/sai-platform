-- Phase 1: multi-company memberships (additive; keep User.companyId for compatibility)

CREATE TYPE "MembershipStatus" AS ENUM ('ACTIVE', 'DISABLED');

CREATE TABLE "UserCompanyMembership" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "status" "MembershipStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserCompanyMembership_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "UserCompanyMembership_userId_companyId_key" ON "UserCompanyMembership"("userId", "companyId");
CREATE INDEX "UserCompanyMembership_companyId_idx" ON "UserCompanyMembership"("companyId");
CREATE INDEX "UserCompanyMembership_userId_idx" ON "UserCompanyMembership"("userId");

ALTER TABLE "UserCompanyMembership" ADD CONSTRAINT "UserCompanyMembership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UserCompanyMembership" ADD CONSTRAINT "UserCompanyMembership_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill memberships for existing users
INSERT INTO "UserCompanyMembership" ("id", "userId", "companyId", "role", "status", "createdAt", "updatedAt")
SELECT
  concat('ucm_', substr(md5(random()::text), 1, 24)) as "id",
  u."id",
  u."companyId",
  u."role",
  'ACTIVE',
  now(),
  now()
FROM "User" u
WHERE u."companyId" IS NOT NULL
ON CONFLICT ("userId", "companyId") DO NOTHING;

