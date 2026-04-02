-- AlterTable: Add signGroup column to ContractSignZone
ALTER TABLE "ContractSignZone" ADD COLUMN IF NOT EXISTS "signGroup" INTEGER NOT NULL DEFAULT 1;
