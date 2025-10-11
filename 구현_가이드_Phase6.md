# 구현 가이드 - Phase 6: 배포 및 테스트 (1주)

> **⚠️ 필수 선행 작업**: Phase 1, 2, 3, 4, 5 완료 필수
> **📅 예상 기간**: 1주 (Week 13)
> **📊 예상 작업량**: ~10개 파일, ~1,500 라인
> **❌ 실제 상태**: 미구현 (배포 설정 없음)

---

## 📋 Phase 6 개요

### 주요 목표
1. **Docker 컨테이너화**
2. **GitHub Actions CI/CD** 파이프라인
3. **GCP Cloud Run** 배포
4. **모니터링 및 로깅** 설정
5. **통합 테스트** 및 사용자 테스트

### 기술 스택
- **컨테이너**: Docker
- **오케스트레이션**: docker-compose
- **CI/CD**: GitHub Actions
- **배포**: GCP Cloud Run
- **모니터링**: Sentry
- **로깅**: GCP Cloud Logging

---

## 🗂️ Phase 6 파일 맵

### 생성 파일 목록

```
프로젝트 루트/
├── docker/
│   ├── Dockerfile.backend       [80-120 라인] 백엔드 이미지
│   ├── Dockerfile.web           [60-90 라인] 웹 이미지
│   └── nginx.conf               [50-80 라인] Nginx 설정
│
├── docker-compose.yml           [150-200 라인] 로컬 개발 환경
├── docker-compose.prod.yml      [100-150 라인] 프로덕션 환경
│
├── .github/
│   └── workflows/
│       ├── backend-ci.yml       [100-150 라인] 백엔드 CI/CD
│       ├── web-ci.yml           [80-120 라인] 웹 CI/CD
│       └── mobile-ci.yml        [80-120 라인] 모바일 CI/CD
│
├── scripts/
│   ├── deploy-backend.sh        [80-120 라인] 백엔드 배포 스크립트
│   ├── deploy-web.sh            [60-90 라인] 웹 배포 스크립트
│   └── db-migrate.sh            [50-80 라인] DB 마이그레이션
│
└── .env.production              [30-50 라인] 프로덕션 환경변수
```

---

## 📅 Week 13: 통합 테스트 & 배포

### Task 13.1: Docker 이미지 빌드

**파일**: `docker/Dockerfile.backend`
**예상 라인**: 80-120 라인

```dockerfile
# Base image
FROM node:18-alpine AS base

WORKDIR /app

# Install dependencies
COPY backend/package*.json ./
RUN npm ci --only=production

# Build stage
FROM base AS build

COPY backend/ ./
RUN npm run build

# Production stage
FROM node:18-alpine AS production

WORKDIR /app

# Copy dependencies
COPY --from=base /app/node_modules ./node_modules

# Copy built files
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma

# Generate Prisma client
RUN npx prisma generate

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start application
CMD ["node", "dist/index.js"]
```

**파일**: `docker/Dockerfile.web`
**예상 라인**: 60-90 라인

```dockerfile
# Build stage
FROM node:18-alpine AS build

WORKDIR /app

COPY web/package*.json ./
RUN npm ci

COPY web/ ./
RUN npm run build

# Production stage with nginx
FROM nginx:alpine AS production

# Copy built files
COPY --from=build /app/dist /usr/share/nginx/html

# Copy nginx config
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

**파일**: `docker/nginx.conf`
**예상 라인**: 50-80 라인

```nginx
server {
    listen 80;
    server_name localhost;

    root /usr/share/nginx/html;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    # SPA routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API proxy (optional)
    location /api {
        proxy_pass http://backend:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Cache static assets
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

---

### Task 13.2: docker-compose 설정

**파일**: `docker-compose.yml` (로컬 개발 환경)
**예상 라인**: 150-200 라인

```yaml
version: '3.8'

services:
  # PostgreSQL
  postgres:
    image: postgres:15-alpine
    container_name: daham-postgres
    environment:
      POSTGRES_USER: daham
      POSTGRES_PASSWORD: daham123
      POSTGRES_DB: daham_voc
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U daham"]
      interval: 10s
      timeout: 5s
      retries: 5

  # MongoDB
  mongodb:
    image: mongo:6
    container_name: daham-mongodb
    environment:
      MONGO_INITDB_ROOT_USERNAME: daham
      MONGO_INITDB_ROOT_PASSWORD: daham123
    ports:
      - "27017:27017"
    volumes:
      - mongodb_data:/data/db
    healthcheck:
      test: echo 'db.runCommand("ping").ok' | mongosh localhost:27017/test --quiet
      interval: 10s
      timeout: 5s
      retries: 5

  # Redis
  redis:
    image: redis:7-alpine
    container_name: daham-redis
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  # Backend API
  backend:
    build:
      context: .
      dockerfile: docker/Dockerfile.backend
    container_name: daham-backend
    environment:
      NODE_ENV: development
      DATABASE_URL: postgresql://daham:daham123@postgres:5432/daham_voc
      MONGODB_URI: mongodb://daham:daham123@mongodb:27017/daham_voc
      REDIS_URL: redis://redis:6379
      JWT_SECRET: dev_secret_key
      PORT: 3000
    ports:
      - "3000:3000"
    depends_on:
      postgres:
        condition: service_healthy
      mongodb:
        condition: service_healthy
      redis:
        condition: service_healthy
    volumes:
      - ./backend:/app
      - /app/node_modules
    command: npm run dev

  # Web Frontend
  web:
    build:
      context: .
      dockerfile: docker/Dockerfile.web
    container_name: daham-web
    ports:
      - "5173:80"
    depends_on:
      - backend

volumes:
  postgres_data:
  mongodb_data:
  redis_data:
```

**파일**: `docker-compose.prod.yml` (프로덕션 환경)
**예상 라인**: 100-150 라인

```yaml
version: '3.8'

services:
  backend:
    build:
      context: .
      dockerfile: docker/Dockerfile.backend
      target: production
    container_name: daham-backend-prod
    environment:
      NODE_ENV: production
      DATABASE_URL: ${DATABASE_URL}
      MONGODB_URI: ${MONGODB_URI}
      REDIS_URL: ${REDIS_URL}
      JWT_SECRET: ${JWT_SECRET}
      GCP_PROJECT_ID: ${GCP_PROJECT_ID}
      GCP_BUCKET_NAME: ${GCP_BUCKET_NAME}
    ports:
      - "3000:3000"
    restart: unless-stopped
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"

  web:
    build:
      context: .
      dockerfile: docker/Dockerfile.web
      target: production
    container_name: daham-web-prod
    ports:
      - "80:80"
    depends_on:
      - backend
    restart: unless-stopped
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
```

---

### Task 13.3: GitHub Actions CI/CD

**파일**: `.github/workflows/backend-ci.yml`
**예상 라인**: 100-150 라인

```yaml
name: Backend CI/CD

on:
  push:
    branches:
      - main
      - develop
    paths:
      - 'backend/**'
  pull_request:
    branches:
      - main
      - develop
    paths:
      - 'backend/**'

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
          POSTGRES_DB: test_db
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: |
          cd backend
          npm ci

      - name: Run linter
        run: |
          cd backend
          npm run lint

      - name: Run tests
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/test_db
        run: |
          cd backend
          npm run test

      - name: Build
        run: |
          cd backend
          npm run build

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'

    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Authenticate to Google Cloud
        uses: google-github-actions/auth@v1
        with:
          credentials_json: ${{ secrets.GCP_SA_KEY }}

      - name: Set up Cloud SDK
        uses: google-github-actions/setup-gcloud@v1

      - name: Build and push Docker image
        run: |
          gcloud builds submit \
            --tag gcr.io/${{ secrets.GCP_PROJECT_ID }}/daham-backend:${{ github.sha }} \
            --file docker/Dockerfile.backend \
            .

      - name: Deploy to Cloud Run
        run: |
          gcloud run deploy daham-backend \
            --image gcr.io/${{ secrets.GCP_PROJECT_ID }}/daham-backend:${{ github.sha }} \
            --platform managed \
            --region asia-northeast3 \
            --allow-unauthenticated \
            --set-env-vars "NODE_ENV=production" \
            --set-secrets "DATABASE_URL=DATABASE_URL:latest,JWT_SECRET=JWT_SECRET:latest"
```

**파일**: `.github/workflows/web-ci.yml`
**예상 라인**: 80-120 라인

```yaml
name: Web CI/CD

on:
  push:
    branches:
      - main
    paths:
      - 'web/**'

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: |
          cd web
          npm ci

      - name: Build
        env:
          VITE_API_BASE_URL: ${{ secrets.VITE_API_BASE_URL }}
        run: |
          cd web
          npm run build

      - name: Deploy to Cloud Storage (optional)
        if: github.ref == 'refs/heads/main'
        run: |
          gsutil -m rsync -r -d web/dist gs://${{ secrets.WEB_BUCKET_NAME }}
```

---

### Task 13.4: GCP Cloud Run 배포 스크립트

**파일**: `scripts/deploy-backend.sh`
**예상 라인**: 80-120 라인

```bash
#!/bin/bash

# 설정
PROJECT_ID="your-gcp-project-id"
REGION="asia-northeast3"
SERVICE_NAME="daham-backend"
IMAGE_NAME="gcr.io/$PROJECT_ID/$SERVICE_NAME"

# 에러 발생 시 종료
set -e

echo "🚀 Daham VOC Backend 배포 시작..."

# 1. Docker 이미지 빌드
echo "📦 Docker 이미지 빌드 중..."
docker build -t $IMAGE_NAME:latest -f docker/Dockerfile.backend .

# 2. GCP 인증 확인
echo "🔐 GCP 인증 확인..."
gcloud config set project $PROJECT_ID

# 3. Docker 이미지 푸시
echo "⬆️  이미지를 GCR에 푸시 중..."
docker push $IMAGE_NAME:latest

# 4. Cloud Run 배포
echo "🌐 Cloud Run에 배포 중..."
gcloud run deploy $SERVICE_NAME \
  --image $IMAGE_NAME:latest \
  --platform managed \
  --region $REGION \
  --allow-unauthenticated \
  --min-instances 1 \
  --max-instances 10 \
  --memory 512Mi \
  --cpu 1 \
  --timeout 300 \
  --set-env-vars "NODE_ENV=production" \
  --set-secrets "DATABASE_URL=DATABASE_URL:latest,JWT_SECRET=JWT_SECRET:latest,MONGODB_URI=MONGODB_URI:latest"

# 5. 배포 URL 출력
echo "✅ 배포 완료!"
gcloud run services describe $SERVICE_NAME --region $REGION --format 'value(status.url)'
```

**파일**: `scripts/db-migrate.sh`
**예상 라인**: 50-80 라인

```bash
#!/bin/bash

# Prisma 마이그레이션 실행

set -e

echo "🗄️  데이터베이스 마이그레이션 시작..."

cd backend

# 1. Prisma 스키마 검증
echo "✅ Prisma 스키마 검증 중..."
npx prisma validate

# 2. 마이그레이션 생성
echo "📝 마이그레이션 생성 중..."
npx prisma migrate dev --name auto_migration

# 3. Prisma Client 생성
echo "🔧 Prisma Client 생성 중..."
npx prisma generate

# 4. 시드 데이터 (선택 사항)
if [ -f "prisma/seed.ts" ]; then
  echo "🌱 시드 데이터 삽입 중..."
  npx prisma db seed
fi

echo "✅ 마이그레이션 완료!"
```

---

### Task 13.5: 모니터링 설정 (Sentry)

**파일**: `backend/src/config/sentry.ts`
**예상 라인**: 50-80 라인

```typescript
import * as Sentry from '@sentry/node';
import env from './env';

export function initSentry() {
  if (env.NODE_ENV === 'production' && env.SENTRY_DSN) {
    Sentry.init({
      dsn: env.SENTRY_DSN,
      environment: env.NODE_ENV,
      tracesSampleRate: 0.1,

      // 에러 필터링
      beforeSend(event, hint) {
        // 민감한 정보 제거
        if (event.request) {
          delete event.request.cookies;
        }

        return event;
      },
    });

    console.log('✅ Sentry initialized');
  }
}

export { Sentry };
```

**파일**: `backend/src/index.ts` (Sentry 적용)
**기존 파일 수정**: Sentry 초기화 추가

```typescript
import { initSentry, Sentry } from './config/sentry';
import app from './app';

// Sentry 초기화 (앱 시작 전)
initSentry();

// 에러 핸들러 (라우트 이후)
app.use(Sentry.Handlers.errorHandler());

// 서버 시작
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

---

### Task 13.6: Health Check 엔드포인트

**파일**: `backend/src/routes/health.routes.ts`
**예상 라인**: 50-80 라인

```typescript
import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { redis } from '../config/redis';

const router = Router();
const prisma = new PrismaClient();

// Health check
router.get('/health', async (req, res) => {
  const health = {
    uptime: process.uptime(),
    timestamp: Date.now(),
    status: 'OK',
    checks: {
      database: 'OK',
      redis: 'OK',
    },
  };

  try {
    // PostgreSQL 연결 확인
    await prisma.$queryRaw`SELECT 1`;
  } catch (error) {
    health.status = 'ERROR';
    health.checks.database = 'ERROR';
  }

  try {
    // Redis 연결 확인
    await redis.ping();
  } catch (error) {
    health.status = 'ERROR';
    health.checks.redis = 'ERROR';
  }

  const statusCode = health.status === 'OK' ? 200 : 503;

  res.status(statusCode).json(health);
});

export default router;
```

**파일**: `backend/src/app.ts` (기존 파일 수정)

```typescript
import healthRoutes from './routes/health.routes';

// Health check 라우트 (인증 불필요)
app.use('/', healthRoutes);
```

---

### Task 13.7: 환경 변수 관리 (GCP Secret Manager)

**GCP Secret Manager 설정 명령어**:

```bash
# Secrets 생성
gcloud secrets create DATABASE_URL --data-file=- <<EOF
postgresql://user:password@host:5432/dbname
EOF

gcloud secrets create JWT_SECRET --data-file=- <<EOF
your_jwt_secret_key
EOF

gcloud secrets create MONGODB_URI --data-file=- <<EOF
mongodb://user:password@host:27017/dbname
EOF

# Cloud Run 서비스에 Secret 접근 권한 부여
gcloud secrets add-iam-policy-binding DATABASE_URL \
  --member=serviceAccount:YOUR_SERVICE_ACCOUNT@PROJECT_ID.iam.gserviceaccount.com \
  --role=roles/secretmanager.secretAccessor
```

---

### Task 13.8: 통합 테스트

**파일**: `backend/tests/integration/api.test.ts`
**예상 라인**: 150-200 라인

```typescript
import request from 'supertest';
import app from '../../src/app';

describe('Integration Tests', () => {
  let authToken: string;

  // 로그인 테스트
  describe('POST /api/auth/login', () => {
    it('should login successfully', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@example.com',
          password: 'password123',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.token).toBeDefined();

      authToken = response.body.data.token;
    });
  });

  // 사업장 조회 테스트
  describe('GET /api/sites', () => {
    it('should get sites list', async () => {
      const response = await request(app)
        .get('/api/sites')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  // VOC 생성 테스트
  describe('POST /api/feedbacks', () => {
    it('should create feedback', async () => {
      const response = await request(app)
        .post('/api/feedbacks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          siteId: 'test-site-id',
          content: 'Test feedback',
          rating: 5,
          feedbackType: 'STAFF',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
    });
  });

  // 근태 체크인 테스트
  describe('POST /api/attendance/check-in', () => {
    it('should check in successfully', async () => {
      const response = await request(app)
        .post('/api/attendance/check-in')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          siteId: 'test-site-id',
          latitude: 37.5,
          longitude: 127.0,
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
    });
  });
});
```

---

### Task 13.9: 성능 최적화 체크리스트

**항목**:
1. **데이터베이스 인덱스** 확인 (Prisma schema의 @@index)
2. **Redis 캐싱** 적용 여부 (통계, 목록 조회 등)
3. **이미지 압축** 및 **썸네일** 생성 확인
4. **API 응답 시간** 모니터링 (Sentry Performance)
5. **N+1 쿼리 문제** 확인 (Prisma include 최적화)
6. **페이지네이션** 적용 (대량 데이터 조회 시)

---

### Task 13.10: 사용자 테스트 체크리스트

**백엔드 API 테스트**:
- [ ] 회원가입/로그인/로그아웃
- [ ] 사업장 CRUD
- [ ] 식단 등록 (이미지 포함)
- [ ] 배식 사진 업로드 (GPS 검증)
- [ ] VOC 작성 및 답변
- [ ] 출퇴근 체크인/체크아웃
- [ ] 대시보드 통계 조회

**웹 프론트엔드 테스트**:
- [ ] 로그인 후 대시보드 표시
- [ ] 사업장 목록 조회 및 등록
- [ ] 식단 이미지 업로드
- [ ] VOC 관리 페이지
- [ ] 카카오맵 표시
- [ ] 통계 차트 렌더링

**모바일 앱 테스트**:
- [ ] 로그인 및 홈 화면
- [ ] GPS 권한 요청 및 위치 추적
- [ ] 출퇴근 체크인 (GPS 검증)
- [ ] 카메라 촬영 및 업로드 (기기 저장 안 함)
- [ ] VOC 작성 및 별점
- [ ] 오프라인 모드 동작
- [ ] FCM 푸시 알림 수신

---

## ✅ Phase 6 완료 체크리스트

### Week 13: 배포 및 테스트 (10개 작업)
- [ ] Task 13.1: Docker 이미지 빌드
- [ ] Task 13.2: docker-compose 설정
- [ ] Task 13.3: GitHub Actions CI/CD
- [ ] Task 13.4: GCP Cloud Run 배포 스크립트
- [ ] Task 13.5: 모니터링 설정 (Sentry)
- [ ] Task 13.6: Health Check 엔드포인트
- [ ] Task 13.7: 환경 변수 관리 (GCP Secret Manager)
- [ ] Task 13.8: 통합 테스트
- [ ] Task 13.9: 성능 최적화 체크리스트
- [ ] Task 13.10: 사용자 테스트 체크리스트

### 최종 확인 사항
- [ ] 모든 환경 변수가 GCP Secret Manager에 등록되었는가?
- [ ] Docker 이미지가 정상적으로 빌드되는가?
- [ ] GitHub Actions CI/CD가 정상 작동하는가?
- [ ] Cloud Run 배포가 성공하는가?
- [ ] Health check 엔드포인트가 응답하는가?
- [ ] Sentry에 에러가 정상적으로 전송되는가?
- [ ] 통합 테스트가 모두 통과하는가?
- [ ] 사용자 테스트가 완료되었는가?

---

## 📝 최종 인계 템플릿

```
=== Phase 6 완료 보고 ===

완료한 작업:
- Week 13: Docker, CI/CD, GCP Cloud Run 배포

생성된 파일:
1. docker/Dockerfile.backend
2. docker/Dockerfile.web
3. docker/nginx.conf
4. docker-compose.yml
5. .github/workflows/backend-ci.yml
6. .github/workflows/web-ci.yml
7. scripts/deploy-backend.sh
8. scripts/db-migrate.sh
9. backend/src/config/sentry.ts
10. backend/tests/integration/api.test.ts

배포 완료:
- [x] Backend API: https://daham-backend-xxx.run.app
- [x] Web Frontend: https://daham-web-xxx.run.app

모니터링:
- [x] Sentry 연동 완료
- [x] Health check 엔드포인트 동작
- [x] GCP Cloud Logging 활성화

테스트 완료:
- [x] 통합 테스트 통과
- [x] 사용자 테스트 완료
- [x] 성능 최적화 확인

주의사항:
- GCP Secret Manager에 모든 민감 정보 저장됨
- CI/CD는 main 브랜치 푸시 시 자동 배포
- 이미지 파일은 GCP Storage에 저장

다음 단계:
- 실사용자 피드백 수집
- 버그 수정 및 기능 개선
- 성능 모니터링 지속
```

---

## 🎉 전체 프로젝트 완료!

**Daham VOC 시스템** 구현이 완료되었습니다!

### 프로젝트 요약
- **총 기간**: 12-13주
- **Phase**: 6개
- **파일 수**: ~195개
- **코드 라인**: ~31,500 라인

### 주요 기능
1. ✅ 사업장 관리 (620개 사업장 지원)
2. ✅ 이미지 기반 식단 관리
3. ✅ GPS 기반 배식 사진 관리
4. ✅ VOC 시스템 (별점 평가)
5. ✅ GPS 기반 근태 관리
6. ✅ 통계 및 대시보드
7. ✅ 관리자 웹 애플리케이션
8. ✅ 담당자/고객사 모바일 앱
9. ✅ 오프라인 모드 지원
10. ✅ FCM 푸시 알림

### 기술 스택
- **Backend**: Node.js, Express, TypeScript, Prisma, PostgreSQL, MongoDB, Redis
- **Web**: React, Vite, Ant Design, Zustand, React Query
- **Mobile**: React Native, React Native Paper, WatermelonDB
- **Infra**: Docker, GCP Cloud Run, GitHub Actions

---

## 📚 참고 문서

- **개발_가이드.md**: 기술 스택 및 DB 설계
- **운영_가이드.md**: 사용자 가이드 및 화면 설계
- **구현_가이드_목차.md**: 전체 Phase 목차

---

## 📊 Phase 6 실제 구현 상태 (2025-10-12 기준)

### ❌ 전체 미구현

**실제 구현 상태**: Phase 6의 모든 기능이 **미구현** 상태입니다.

### 미구현 항목 (전체)

| 기능 분류 | 상세 기능 | 가이드 예상 파일 | 실제 상태 |
|---------|---------|----------------|---------|
| **Docker** | Dockerfile.backend | docker/Dockerfile.backend | ❌ 없음 |
| | Dockerfile.web | docker/Dockerfile.web | ❌ 없음 |
| | nginx.conf | docker/nginx.conf | ❌ 없음 |
| | docker-compose.yml | docker-compose.yml | ❌ 없음 |
| | docker-compose.prod.yml | docker-compose.prod.yml | ❌ 없음 |
| **CI/CD** | Backend CI/CD | .github/workflows/backend-ci.yml | ❌ 없음 |
| | Web CI/CD | .github/workflows/web-ci.yml | ❌ 없음 |
| | Mobile CI/CD | .github/workflows/mobile-ci.yml | ❌ 없음 |
| **배포 스크립트** | 백엔드 배포 스크립트 | scripts/deploy-backend.sh | ❌ 없음 |
| | 웹 배포 스크립트 | scripts/deploy-web.sh | ❌ 없음 |
| | DB 마이그레이션 스크립트 | scripts/db-migrate.sh | ❌ 없음 |
| **모니터링** | Sentry 설정 | backend/src/config/sentry.ts | ❌ 없음 |
| | Health Check API | backend/src/routes/health.routes.ts | ❌ 없음 |
| **통합 테스트** | API 통합 테스트 | backend/tests/integration/api.test.ts | ❌ 없음 |
| **GCP** | GCP Cloud Run 배포 | - | ❌ 없음 |
| | Secret Manager 설정 | - | ❌ 없음 |

### 📂 실제 파일 구조 (0개 파일)

```
프로젝트 루트/
├── docker/                        ❌ 디렉토리 없음
├── .github/                       ❌ 디렉토리 없음
├── scripts/                       ❌ 배포 스크립트 없음
├── docker-compose.yml             ❌ 없음
└── .env.production                ❌ 없음
```

### 🚫 체크리스트 (전체 미완료)

### Week 13: 배포 및 테스트
- [ ] Task 13.1: Docker 이미지 빌드 (미구현)
- [ ] Task 13.2: docker-compose 설정 (미구현)
- [ ] Task 13.3: GitHub Actions CI/CD (미구현)
- [ ] Task 13.4: GCP Cloud Run 배포 스크립트 (미구현)
- [ ] Task 13.5: 모니터링 설정 (Sentry) (미구현)
- [ ] Task 13.6: Health Check 엔드포인트 (미구현)
- [ ] Task 13.7: 환경 변수 관리 (미구현)
- [ ] Task 13.8: 통합 테스트 (미구현)
- [ ] Task 13.9: 성능 최적화 체크리스트 (미구현)
- [ ] Task 13.10: 사용자 테스트 체크리스트 (미구현)

### 현재 상태

프로젝트는 **개발 환경에서만 실행 가능**한 상태이며, 아래 사항들이 준비되어 있지 않습니다:

1. **컨테이너화 없음**: Docker 설정 미구현
2. **CI/CD 없음**: 자동 빌드/배포 파이프라인 미구현
3. **클라우드 배포 없음**: GCP Cloud Run 배포 설정 미구현
4. **모니터링 없음**: Sentry 등 에러 모니터링 미구현
5. **통합 테스트 없음**: 자동화된 API 테스트 미구현

### 🔧 현재 실행 방법

**백엔드:**
```bash
cd backend
npm install
npx prisma generate
npm run dev  # http://localhost:3000
```

**웹:**
```bash
cd web
npm install
npm run dev  # http://localhost:5173
```

**모바일:**
```bash
cd mobile
npm install
npm start  # Expo Dev Server
```

### ⚠️ 배포를 위해 필요한 작업

1. **Docker 설정**: Dockerfile 및 docker-compose.yml 작성
2. **CI/CD 파이프라인**: GitHub Actions workflows 구성
3. **클라우드 인프라**: GCP 프로젝트 설정 및 Cloud Run 배포
4. **환경 변수 관리**: Secret Manager 설정
5. **모니터링**: Sentry, Cloud Logging 연동
6. **통합 테스트**: Jest/Supertest로 API 테스트 작성

### 📈 통계

| 항목 | 가이드 예상 | 실제 구현 | 달성률 |
|-----|----------|---------|--------|
| **총 파일 수** | ~10개 | 0개 | 0% |
| **총 라인 수** | ~1,500 | 0 | 0% |
| **핵심 기능** | 10개 | 0개 | 0% |

---

**🚀 Happy Coding!**
