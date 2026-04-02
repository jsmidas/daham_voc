-- CreateTable
CREATE TABLE "Holiday" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Holiday_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Holiday_date_key" ON "Holiday"("date");

-- CreateIndex
CREATE INDEX "Holiday_year_idx" ON "Holiday"("year");

-- CreateIndex
CREATE INDEX "Holiday_date_idx" ON "Holiday"("date");

-- 2026년 대한민국 법정 공휴일 초기 데이터
INSERT INTO "Holiday" ("id", "date", "name", "year", "createdAt", "updatedAt") VALUES
(gen_random_uuid(), '2026-01-01 00:00:00', '신정', 2026, NOW(), NOW()),
(gen_random_uuid(), '2026-02-16 00:00:00', '설날 전날', 2026, NOW(), NOW()),
(gen_random_uuid(), '2026-02-17 00:00:00', '설날', 2026, NOW(), NOW()),
(gen_random_uuid(), '2026-02-18 00:00:00', '설날 다음날', 2026, NOW(), NOW()),
(gen_random_uuid(), '2026-03-01 00:00:00', '삼일절', 2026, NOW(), NOW()),
(gen_random_uuid(), '2026-05-05 00:00:00', '어린이날', 2026, NOW(), NOW()),
(gen_random_uuid(), '2026-05-24 00:00:00', '석가탄신일', 2026, NOW(), NOW()),
(gen_random_uuid(), '2026-06-06 00:00:00', '현충일', 2026, NOW(), NOW()),
(gen_random_uuid(), '2026-08-15 00:00:00', '광복절', 2026, NOW(), NOW()),
(gen_random_uuid(), '2026-09-24 00:00:00', '추석 전날', 2026, NOW(), NOW()),
(gen_random_uuid(), '2026-09-25 00:00:00', '추석', 2026, NOW(), NOW()),
(gen_random_uuid(), '2026-09-26 00:00:00', '추석 다음날', 2026, NOW(), NOW()),
(gen_random_uuid(), '2026-10-03 00:00:00', '개천절', 2026, NOW(), NOW()),
(gen_random_uuid(), '2026-10-09 00:00:00', '한글날', 2026, NOW(), NOW()),
(gen_random_uuid(), '2026-12-25 00:00:00', '크리스마스', 2026, NOW(), NOW());
