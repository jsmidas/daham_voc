-- AlterTable
ALTER TABLE "Contract" DROP COLUMN IF EXISTS "signHeight",
DROP COLUMN IF EXISTS "signPageNumber",
DROP COLUMN IF EXISTS "signWidth",
DROP COLUMN IF EXISTS "signX",
DROP COLUMN IF EXISTS "signY";

-- CreateTable
CREATE TABLE IF NOT EXISTS "ContractSignZone" (
    "id" TEXT NOT NULL,
    "contractId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "pageNumber" INTEGER NOT NULL,
    "x" DOUBLE PRECISION NOT NULL,
    "y" DOUBLE PRECISION NOT NULL,
    "width" DOUBLE PRECISION NOT NULL,
    "height" DOUBLE PRECISION NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContractSignZone_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ContractSignZone_contractId_idx" ON "ContractSignZone"("contractId");

-- AddForeignKey
ALTER TABLE "ContractSignZone" ADD CONSTRAINT "ContractSignZone_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "Contract"("id") ON DELETE CASCADE ON UPDATE CASCADE;
