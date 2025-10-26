#!/bin/bash
# 비밀번호 변경 스크립트

PHONE="01035421898"
OLD_PASSWORD="1234"
NEW_PASSWORD="125300"
API_URL="https://api.dahamvoc.co.kr/api/v1"

echo "🔐 로그인 중..."
LOGIN_RESPONSE=$(curl -s -X POST ${API_URL}/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"phone\":\"${PHONE}\",\"password\":\"${OLD_PASSWORD}\"}")

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "❌ 로그인 실패!"
  echo $LOGIN_RESPONSE
  exit 1
fi

echo "✅ 로그인 성공!"
echo ""
echo "🔄 비밀번호 변경 중..."

CHANGE_RESPONSE=$(curl -s -X PUT ${API_URL}/auth/password \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${TOKEN}" \
  -d "{\"oldPassword\":\"${OLD_PASSWORD}\",\"newPassword\":\"${NEW_PASSWORD}\"}")

echo $CHANGE_RESPONSE | grep -q '"success":true'

if [ $? -eq 0 ]; then
  echo "✅ 비밀번호 변경 성공!"
  echo ""
  echo "🔐 새 비밀번호로 로그인 테스트..."

  TEST_RESPONSE=$(curl -s -X POST ${API_URL}/auth/login \
    -H "Content-Type: application/json" \
    -d "{\"phone\":\"${PHONE}\",\"password\":\"${NEW_PASSWORD}\"}")

  echo $TEST_RESPONSE | grep -q '"success":true'

  if [ $? -eq 0 ]; then
    echo "✅ 새 비밀번호 로그인 성공!"
    echo ""
    echo "📱 전화번호: ${PHONE}"
    echo "🔑 새 비밀번호: ${NEW_PASSWORD}"
  else
    echo "❌ 새 비밀번호 로그인 실패!"
    echo $TEST_RESPONSE
  fi
else
  echo "❌ 비밀번호 변경 실패!"
  echo $CHANGE_RESPONSE
fi
