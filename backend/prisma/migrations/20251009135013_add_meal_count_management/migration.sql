-- CreateTable
CREATE TABLE "MealCountSetting" (
    "id" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "deadlineHoursBefore" INTEGER NOT NULL DEFAULT 24,
    "breakfastStartTime" TEXT,
    "lunchStartTime" TEXT,
    "dinnerStartTime" TEXT,
    "allowLateSubmission" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MealCountSetting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MealCount" (
    "id" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "mealType" "MealType" NOT NULL,
    "count" INTEGER NOT NULL,
    "submittedBy" TEXT NOT NULL,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isLate" BOOLEAN NOT NULL DEFAULT false,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MealCount_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MealCountSetting_siteId_key" ON "MealCountSetting"("siteId");

-- CreateIndex
CREATE INDEX "MealCountSetting_siteId_idx" ON "MealCountSetting"("siteId");

-- CreateIndex
CREATE INDEX "MealCount_siteId_date_idx" ON "MealCount"("siteId", "date");

-- CreateIndex
CREATE INDEX "MealCount_date_idx" ON "MealCount"("date");

-- CreateIndex
CREATE UNIQUE INDEX "MealCount_siteId_date_mealType_key" ON "MealCount"("siteId", "date", "mealType");

-- AddForeignKey
ALTER TABLE "MealCountSetting" ADD CONSTRAINT "MealCountSetting_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MealCount" ADD CONSTRAINT "MealCount_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MealCount" ADD CONSTRAINT "MealCount_submittedBy_fkey" FOREIGN KEY ("submittedBy") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
