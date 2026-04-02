-- 기존 위탁사업장에 자체식단 메뉴 자동 생성
-- 이 스크립트는 위탁사업장(type='CONSIGNMENT')에 대해 "사업장명 자체식단" 메뉴를 생성하고 연결합니다.

DO $$
DECLARE
  site_record RECORD;
  menu_id TEXT;
BEGIN
  FOR site_record IN
    SELECT id, name FROM "Site"
    WHERE type = 'CONSIGNMENT' AND "deletedAt" IS NULL AND "isActive" = true
  LOOP
    -- 메뉴가 이미 있는지 확인
    SELECT id INTO menu_id FROM "MealMenu"
    WHERE name = site_record.name || ' 자체식단' LIMIT 1;

    -- 없으면 생성
    IF menu_id IS NULL THEN
      menu_id := gen_random_uuid();
      INSERT INTO "MealMenu" (id, name, description, "sortOrder", "isActive", "createdAt", "updatedAt")
      VALUES (menu_id, site_record.name || ' 자체식단', site_record.name || ' 위탁사업장 자체식단', 100, true, NOW(), NOW());
    END IF;

    -- SiteMealMenu 연결 (중복 방지)
    INSERT INTO "SiteMealMenu" (id, "siteId", "mealMenuId", "sortOrder", "createdAt")
    VALUES (gen_random_uuid(), site_record.id, menu_id, 0, NOW())
    ON CONFLICT ("siteId", "mealMenuId") DO NOTHING;
  END LOOP;
END $$;
