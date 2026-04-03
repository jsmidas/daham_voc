-- AlterTable: Add siteCode column
ALTER TABLE "sites" ADD COLUMN "siteCode" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "sites_siteCode_key" ON "sites"("siteCode");
