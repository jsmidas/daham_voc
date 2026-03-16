-- CreateEnum
CREATE TYPE "ContractStatus" AS ENUM ('PENDING', 'SIGNED', 'EXPIRED');

-- CreateTable
CREATE TABLE "Contract" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "createdBy" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Contract_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContractPage" (
    "id" TEXT NOT NULL,
    "contractId" TEXT NOT NULL,
    "pageNumber" INTEGER NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContractPage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContractAssignment" (
    "id" TEXT NOT NULL,
    "contractId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "ContractStatus" NOT NULL DEFAULT 'PENDING',
    "signedAt" TIMESTAMP(3),
    "signatureImageUrl" TEXT,
    "signedDocumentUrl" TEXT,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContractAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Contract_createdBy_idx" ON "Contract"("createdBy");

-- CreateIndex
CREATE INDEX "Contract_isActive_idx" ON "Contract"("isActive");

-- CreateIndex
CREATE INDEX "Contract_createdAt_idx" ON "Contract"("createdAt");

-- CreateIndex
CREATE INDEX "ContractPage_contractId_idx" ON "ContractPage"("contractId");

-- CreateIndex
CREATE UNIQUE INDEX "ContractPage_contractId_pageNumber_key" ON "ContractPage"("contractId", "pageNumber");

-- CreateIndex
CREATE INDEX "ContractAssignment_contractId_idx" ON "ContractAssignment"("contractId");

-- CreateIndex
CREATE INDEX "ContractAssignment_userId_idx" ON "ContractAssignment"("userId");

-- CreateIndex
CREATE INDEX "ContractAssignment_status_idx" ON "ContractAssignment"("status");

-- CreateIndex
CREATE INDEX "ContractAssignment_signedAt_idx" ON "ContractAssignment"("signedAt");

-- CreateIndex
CREATE UNIQUE INDEX "ContractAssignment_contractId_userId_key" ON "ContractAssignment"("contractId", "userId");

-- AddForeignKey
ALTER TABLE "ContractPage" ADD CONSTRAINT "ContractPage_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "Contract"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContractAssignment" ADD CONSTRAINT "ContractAssignment_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "Contract"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContractAssignment" ADD CONSTRAINT "ContractAssignment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
