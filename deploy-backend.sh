#!/bin/bash
# 백엔드 자동 배포 스크립트
# GCP VM에서 실행됩니다

set -e  # 에러 발생 시 중단

echo "🚀 Starting backend deployment..."

# 1. 프로젝트 디렉토리로 이동
cd ~/daham_voc

# 2. 최신 코드 가져오기
echo "📥 Pulling latest code from GitHub..."
git pull origin main

# 3. Backend 디렉토리로 이동
cd backend

# 4. 의존성 설치 (package.json 변경 시)
echo "📦 Installing dependencies..."
npm install

# 5. Prisma 클라이언트 재생성
echo "🔧 Generating Prisma client..."
npx prisma generate

# 6. TypeScript 빌드
echo "🔨 Building TypeScript..."
npm run build

# 7. PM2로 백엔드 재시작
echo "🔄 Restarting backend with PM2..."
pm2 restart daham-voc-api || pm2 start dist/server.js --name daham-voc-api

# 8. PM2 설정 저장
pm2 save

echo "✅ Backend deployment completed!"
echo "🌐 Check: https://api.dahamvoc.co.kr/health"

# 9. 상태 확인
sleep 3
pm2 logs daham-voc-api --lines 20 --nostream
curl -s https://api.dahamvoc.co.kr/health | head -10
