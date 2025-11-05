#!/bin/bash
# 전체 시스템 자동 배포 스크립트
# GCP VM에서 실행됩니다

set -e  # 에러 발생 시 중단

echo "🚀 Starting full deployment..."
echo "================================"

# 1. 백엔드 배포
echo ""
echo "1️⃣ Deploying Backend..."
bash ~/daham_voc/deploy-backend.sh

echo ""
echo "================================"

# 2. 웹 프론트엔드 배포
echo ""
echo "2️⃣ Deploying Web Frontend..."
bash ~/daham_voc/deploy-web.sh

echo ""
echo "================================"
echo "✅ Full deployment completed!"
echo ""
echo "🌐 Services:"
echo "  - Web Admin: https://admin.dahamvoc.co.kr"
echo "  - API: https://api.dahamvoc.co.kr"
echo ""
echo "📊 PM2 Status:"
pm2 list
