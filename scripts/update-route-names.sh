#!/bin/bash

# Supabase 연결 정보
DB_URL="postgresql://postgres.iyussgoqhgzogjvpuxnb:cc956697%25%5E12@db.iyussgoqhgzogjvpuxnb.supabase.co:5432/postgres"

echo "🔄 배송 코스 이름 업데이트 중..."

# SQL 실행
PGPASSWORD='cc956697%^12' psql "$DB_URL" <<EOF
-- YD코스부터 YH코스까지 "코스" 단어 제거
UPDATE "DeliveryRoute"
SET name = REPLACE(name, '코스', '')
WHERE code IN ('Y_D', 'Y_E', 'Y_F', 'Y_G', 'Y_H')
  AND name LIKE '%코스%';

-- 업데이트 결과 확인
SELECT code, name FROM "DeliveryRoute" WHERE code IN ('Y_D', 'Y_E', 'Y_F', 'Y_G', 'Y_H') ORDER BY code;
EOF

echo "✅ 업데이트 완료!"
