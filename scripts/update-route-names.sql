-- YD코스부터 YH코스까지 "코스" 단어 제거
-- YD코스 → YD, YE코스 → YE, 등등

UPDATE "DeliveryRoute"
SET name = REPLACE(name, '코스', '')
WHERE code IN ('Y_D', 'Y_E', 'Y_F', 'Y_G', 'Y_H')
  AND name LIKE '%코스%';

-- 업데이트 결과 확인
SELECT code, name FROM "DeliveryRoute" WHERE code IN ('Y_D', 'Y_E', 'Y_F', 'Y_G', 'Y_H');
