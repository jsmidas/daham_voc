-- Delivery schedule: dayOfWeek (0-6) -> scheduleType (WEEKDAY/SATURDAY/SUNDAY/HOLIDAY)
-- Prisma migrate가 자체 트랜잭션으로 감싸므로 BEGIN/COMMIT 사용 금지

-- 1) scheduleType 컬럼 추가
ALTER TABLE "delivery_schedules"
  ADD COLUMN "scheduleType" "ScheduleType";

-- 2) 기존 dayOfWeek를 scheduleType으로 변환
UPDATE "delivery_schedules" SET "scheduleType" = CASE
  WHEN "dayOfWeek" BETWEEN 1 AND 5 THEN 'WEEKDAY'::"ScheduleType"
  WHEN "dayOfWeek" = 6             THEN 'SATURDAY'::"ScheduleType"
  WHEN "dayOfWeek" = 0             THEN 'SUNDAY'::"ScheduleType"
END;

-- 3) 평일 묶음 후 중복이 남는 경우 최신(id max) 1건만 유지
DELETE FROM "delivery_schedules" a
USING "delivery_schedules" b
WHERE a."routeId"      = b."routeId"
  AND a."mealType"     = b."mealType"
  AND a."scheduleType" = b."scheduleType"
  AND a."id" < b."id";

-- 4) NOT NULL 적용
ALTER TABLE "delivery_schedules"
  ALTER COLUMN "scheduleType" SET NOT NULL;

-- 5) unique 제약 교체 (기존 이름이 다를 가능성 대비 IF EXISTS)
ALTER TABLE "delivery_schedules"
  DROP CONSTRAINT IF EXISTS "delivery_schedules_routeId_dayOfWeek_mealType_key";
ALTER TABLE "delivery_schedules"
  ADD CONSTRAINT "delivery_schedules_routeId_scheduleType_mealType_key"
  UNIQUE ("routeId", "scheduleType", "mealType");

-- 6) 인덱스 교체
DROP INDEX IF EXISTS "delivery_schedules_dayOfWeek_idx";
CREATE INDEX "delivery_schedules_scheduleType_idx"
  ON "delivery_schedules" ("scheduleType");

-- 7) 옛 컬럼 제거
ALTER TABLE "delivery_schedules" DROP COLUMN "dayOfWeek";
