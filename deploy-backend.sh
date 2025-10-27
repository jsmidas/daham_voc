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

# 7. PM2로 백엔드 재시작 (ecosystem 설정 사용)
echo "🔄 Restarting backend with PM2..."
cd ~/daham_voc
pm2 stop daham-voc-api 2>/dev/null || true
pm2 delete daham-voc-api 2>/dev/null || true

# ecosystem 설정으로 시작 (안정성 향상)
pm2 start ecosystem.config.js --only daham-voc-api

# 8. PM2 startup 설정 (서버 재부팅 시 자동 시작)
pm2 startup systemd -u $(whoami) --hp $(eval echo ~$(whoami)) 2>/dev/null || true
pm2 save

echo "✅ Backend deployment completed!"
echo "🌐 Check: https://api.dahamvoc.co.kr/health"

# 9. 상태 확인
sleep 3
pm2 logs daham-voc-api --lines 20 --nostream
curl -s https://api.dahamvoc.co.kr/health | head -10
