#!/bin/bash

TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJiYjcxYTQ2ZS02MGVhLTQ0MmEtOGM5OS04M2JhODhkNTZkM2MiLCJlbWFpbCI6ImFkbWluQGRhaGFtLmNvbSIsInJvbGUiOiJTVVBFUl9BRE1JTiIsImRpdmlzaW9uIjoiSFEiLCJpYXQiOjE3NjExMjU3NzAsImV4cCI6MTc2MTczMDU3MH0.DqIAZV6j1030ZdwsRhZL9WGVkq3b3Sqqf1vLipOCkp8"

echo "사업장 ID 목록 가져오는 중..."

# Get all site IDs
SITE_IDS=$(curl -s -H "Authorization: Bearer $TOKEN" "http://localhost:3000/api/v1/sites?page=1&pageSize=200" | grep -o '"id":"[^"]*"' | grep -o '[a-f0-9-]*')

COUNT=0
TOTAL=$(echo "$SITE_IDS" | wc -l)

echo "총 $TOTAL 개 사업장 삭제 시작..."

for SITE_ID in $SITE_IDS; do
    COUNT=$((COUNT + 1))
    echo "[$COUNT/$TOTAL] 삭제 중: $SITE_ID"

    curl -s -X DELETE \
        -H "Authorization: Bearer $TOKEN" \
        "http://localhost:3000/api/v1/sites/$SITE_ID" > /dev/null

    # Rate limiting - 요청 간 약간의 지연
    sleep 0.1
done

echo "완료! $COUNT 개 사업장 삭제됨"
