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

# 6. PM2로 웹 서버 재시작 (ecosystem 설정 사용)
echo "🔄 Restarting web server with PM2..."
cd ~/daham_voc
pm2 stop daham-web 2>/dev/null || true
pm2 delete daham-web 2>/dev/null || true

# serve 패키지가 설치되어 있는지 확인
npm list -g serve || npm install -g serve

# ecosystem 설정으로 시작 (안정성 향상)
pm2 start ecosystem.config.js --only daham-web

# 7. PM2 startup 설정 (서버 재부팅 시 자동 시작)
pm2 startup systemd -u $(whoami) --hp $(eval echo ~$(whoami)) 2>/dev/null || true
pm2 save

echo "✅ Web deployment completed!"
echo "🌐 Check: https://admin.dahamvoc.co.kr"

# 8. 상태 확인
pm2 list
