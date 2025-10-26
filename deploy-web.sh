#!/bin/bash
# 웹 관리자 자동 배포 스크립트
# GCP VM에서 실행됩니다

set -e  # 에러 발생 시 중단

echo "🚀 Starting web deployment..."

# 1. 프로젝트 디렉토리로 이동
cd ~/daham_voc

# 2. 최신 코드 가져오기
echo "📥 Pulling latest code from GitHub..."
git pull origin main

# 3. Web 디렉토리로 이동
cd web

# 4. 의존성 설치 (package.json 변경 시)
echo "📦 Installing dependencies..."
npm install

# 5. 프로덕션 빌드
echo "🔨 Building production bundle..."
npm run build

# 6. PM2로 웹 서버 재시작
echo "🔄 Restarting web server with PM2..."
pm2 stop daham-web 2>/dev/null || true
pm2 delete daham-web 2>/dev/null || true
pm2 serve dist 5173 --name daham-web --spa

# 7. PM2 설정 저장
pm2 save

echo "✅ Web deployment completed!"
echo "🌐 Check: https://admin.dahamvoc.co.kr"

# 8. 상태 확인
pm2 list
