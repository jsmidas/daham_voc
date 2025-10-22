-- AlterTable
ALTER TABLE "MenuType" ADD COLUMN     "division" "Division" NOT NULL DEFAULT 'HQ';

-- CreateIndex
CREATE INDEX "MenuType_division_idx" ON "MenuType"("division");
