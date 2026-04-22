-- Delivery schedule: dayOfWeek (0-6) -> scheduleType (WEEKDAY/SATURDAY/SUNDAY/HOLIDAY)
-- 평일(월-금)을 WEEKDAY로 묶어 관리하고, 특별한날(HOLIDAY)은 기본 비워두고 오버라이드로 투입

BEGIN;

-- 1) scheduleType 컬럼 추가 (일시 nullable)
ALTER TABLE "delivery_schedules"
  ADD COLUMN "scheduleType" "ScheduleType";

-- 2) 기존 dayOfWeek를 scheduleType으로 변환
UPDATE "delivery_schedules" SET "scheduleType" = CASE
  WHEN "dayOfWeek" BETWEEN 1 AND 5 THEN 'WEEKDAY'::"ScheduleType"
  WHEN "dayOfWeek" = 6             THEN 'SATURDAY'::"ScheduleType"
  WHEN "dayOfWeek" = 0             THEN 'SUNDAY'::"ScheduleType"
END;

-- 3) 평일 묶음 후 중복이 남을 경우 최신(id max) 1건만 유지
DELETE FROM "delivery_schedules" a
USING "delivery_schedules" b
WHERE a."routeId"      = b."routeId"
  AND a."mealType"     = b."mealType"
  AND a."scheduleType" = b."scheduleType"
  AND a."id" < b."id";

-- 4) NOT NULL 적용
ALTER TABLE "delivery_schedules"
  ALTER COLUMN "scheduleType" SET NOT NULL;

-- 5) unique 제약 교체
ALTER TABLE "delivery_schedules"
  DROP CONSTRAINT "delivery_schedules_routeId_dayOfWeek_mealType_key";
ALTER TABLE "delivery_schedules"
  ADD CONSTRAINT "delivery_schedules_routeId_scheduleType_mealType_key"
  UNIQUE ("routeId", "scheduleType", "mealType");

-- 6) 인덱스 교체
DROP INDEX IF EXISTS "delivery_schedules_dayOfWeek_idx";
CREATE INDEX "delivery_schedules_scheduleType_idx"
  ON "delivery_schedules" ("scheduleType");

-- 7) 옛 컬럼 제거
ALTER TABLE "delivery_schedules" DROP COLUMN "dayOfWeek";

COMMIT;
