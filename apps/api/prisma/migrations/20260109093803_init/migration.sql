-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'USER',
    "companyId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Company" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "industry" TEXT,
    "country" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AITool" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "vendor" TEXT,
    "description" TEXT,
    "url" TEXT,
    "dataTypes" TEXT[],
    "users" INTEGER NOT NULL,
    "frequency" TEXT NOT NULL,
    "controls" TEXT[],
    "riskScore" INTEGER NOT NULL,
    "riskLevel" TEXT NOT NULL,
    "hasDPA" BOOLEAN NOT NULL DEFAULT false,
    "dataResidency" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AITool_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RiskScore" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "toolId" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "level" TEXT NOT NULL,
    "factors" JSONB NOT NULL,
    "recommendations" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RiskScore_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_companyId_idx" ON "User"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "Company_email_key" ON "Company"("email");

-- CreateIndex
CREATE INDEX "Company_email_idx" ON "Company"("email");

-- CreateIndex
CREATE INDEX "AITool_companyId_idx" ON "AITool"("companyId");

-- CreateIndex
CREATE INDEX "AITool_riskLevel_idx" ON "AITool"("riskLevel");

-- CreateIndex
CREATE INDEX "AITool_category_idx" ON "AITool"("category");

-- CreateIndex
CREATE INDEX "RiskScore_companyId_idx" ON "RiskScore"("companyId");

-- CreateIndex
CREATE INDEX "RiskScore_toolId_idx" ON "RiskScore"("toolId");

-- CreateIndex
CREATE INDEX "RiskScore_createdAt_idx" ON "RiskScore"("createdAt");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AITool" ADD CONSTRAINT "AITool_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RiskScore" ADD CONSTRAINT "RiskScore_toolId_fkey" FOREIGN KEY ("toolId") REFERENCES "AITool"("id") ON DELETE CASCADE ON UPDATE CASCADE;
