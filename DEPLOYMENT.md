# 배포 가이드

## 📋 목차
1. [자동 배포 (권장)](#자동-배포-권장)
2. [수동 배포](#수동-배포)
3. [배포 확인](#배포-확인)
4. [트러블슈팅](#트러블슈팅)

---

## 자동 배포 (권장)

### 1️⃣ GitHub Secrets 설정 (최초 1회)

GitHub 저장소에서 다음 Secrets를 설정해야 합니다:

**Settings → Secrets and variables → Actions → New repository secret**

필요한 Secrets:
- `GCP_SSH_PRIVATE_KEY`: SSH 개인키 전체 내용
- `GCP_VM_IP`: GCP VM IP 주소 (예: `dahamvoc.co.kr`)
- `GCP_VM_USER`: SSH 사용자명 (예: `sos1253`)

자세한 설정 방법은 [GITHUB_ACTIONS_SETUP.md](./GITHUB_ACTIONS_SETUP.md) 참고

### 2️⃣ 배포 실행

#### 자동 배포 (main 브랜치 푸시 시)
```bash
git add .
git commit -m "feat: 새로운 기능 추가"
git push origin main
# 자동으로 GitHub Actions가 실행되어 배포됩니다
```

#### 수동 트리거
1. GitHub 저장소 → **Actions** 탭
2. **"Deploy to GCP VM"** 워크플로우 선택
3. **"Run workflow"** 버튼 클릭
4. **"Run workflow"** 확인

### 3️⃣ 배포 과정 확인

GitHub Actions 탭에서 실시간 로그 확인:
1. 📦 최신 코드 Pull
2. 🔨 Backend 빌드
3. 🔨 Frontend 빌드
4. 🚀 PM2로 서비스 재시작
5. ✅ 배포 완료 확인

---

## 수동 배포

### 🚀 빠른 배포 (현재 사용 방식)

#### 전체 배포 (Backend + Frontend)
```bash
cd ~/daham_voc && git pull origin main && cd backend && npm install && npx prisma generate && npm run build && cd ../web && npm install && npm run build && cd .. && pm2 restart ecosystem.config.js && pm2 save
```

#### Backend만 배포
```bash
cd ~/daham_voc && git pull origin main && cd backend && npm install && npx prisma generate && npm run build && cd .. && pm2 restart daham-voc-api && pm2 save
```

#### Frontend만 배포
```bash
cd ~/daham_voc && git pull origin main && cd web && npm install && npm run build && cd .. && pm2 restart daham-web && pm2 save
```

---

### 📝 단계별 배포

#### 1️⃣ GCP VM SSH 접속

```bash
ssh sos1253@dahamvoc.co.kr
# 또는 GCP Console에서 SSH 버튼 클릭
```

#### 2️⃣ 코드 업데이트

```bash
cd ~/daham_voc
git pull origin main
```

#### 3️⃣ Backend 배포

```bash
cd ~/daham_voc/backend
npm install
npx prisma generate
npm run build
```

#### 4️⃣ Frontend 배포

```bash
cd ~/daham_voc/web
npm install
npm run build
```

#### 5️⃣ 서비스 재시작

```bash
cd ~/daham_voc
pm2 restart ecosystem.config.js
pm2 save
pm2 status
```

**또는 개별 재시작:**
```bash
# Backend만 재시작
pm2 restart daham-voc-api

# Frontend만 재시작
pm2 restart daham-web
```

---

## 배포 확인

### 서비스 상태 확인
```bash
pm2 status
```

예상 출력:
```
┌─────┬───────────────────┬─────────┬─────────┬─────────┐
│ id  │ name              │ status  │ memory  │ cpu     │
├─────┼───────────────────┼─────────┼─────────┼─────────┤
│ 12  │ daham-voc-api     │ online  │ 114.4mb │ 0%      │
│ 17  │ daham-web         │ online  │ 62.4mb  │ 0%      │
└─────┴───────────────────┴─────────┴─────────┴─────────┘
```

### 헬스 체크
```bash
# Backend API
curl https://api.dahamvoc.co.kr/health

# Frontend
curl https://admin.dahamvoc.co.kr
```

### 로그 확인
```bash
# 실시간 로그 보기
pm2 logs daham-voc-api
pm2 logs daham-web

# 에러 로그만 보기
pm2 logs daham-voc-api --err

# 로그 파일 직접 확인
tail -f ~/daham_voc/logs/api-error.log
tail -f ~/daham_voc/logs/api-out.log
```

---

## 트러블슈팅

### ❌ PM2 서비스가 시작되지 않음

**증상:**
```
daham-voc-api │ errored
```

**해결:**
```bash
# 로그 확인
pm2 logs daham-voc-api --lines 50

# 프로세스 삭제 후 재시작
pm2 delete daham-voc-api
cd ~/daham_voc
pm2 start ecosystem.config.js --only daham-voc-api
```

### ❌ Database 연결 실패

**증상:**
```
Error: Authentication failed against database server
```

**해결:**
```bash
# .env 파일 확인
cat ~/daham_voc/backend/.env

# DATABASE_URL이 Supabase 주소인지 확인
# 포트가 6543(Transaction mode)인지 확인
```

**올바른 DATABASE_URL:**
```
DATABASE_URL=postgresql://postgres.iyussgoqhgzogjvpuxnb:cc956697%25%5E12@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres
```

### ❌ Frontend 빌드 실패

**증상:**
```
npm run build
Error: ENOENT: no such file or directory
```

**해결:**
```bash
cd ~/daham_voc/web
rm -rf node_modules package-lock.json
npm install
npm run build
```

### ❌ Git Pull 충돌

**증상:**
```
error: Your local changes to the following files would be overwritten by merge
```

**해결:**
```bash
# 로컬 변경사항 확인
git status

# 로컬 변경사항 버리기 (주의!)
git reset --hard origin/main
git pull origin main
```

### ❌ PM2 ecosystem.config.js 경로 오류

**증상:**
```
Error: Script not found: /root/daham_voc/backend/dist/server.js
```

**해결:**
`ecosystem.config.js` 파일의 `cwd` 설정 확인:
```javascript
// ❌ 잘못된 설정
cwd: '/root/daham_voc'

// ✅ 올바른 설정
cwd: path.resolve(__dirname)
```

### ❌ Port 충돌

**증상:**
```
Error: bind EADDRINUSE :::3000
```

**해결:**
```bash
# 해당 포트를 사용하는 프로세스 확인
lsof -i :3000

# PM2 프로세스 재시작
pm2 restart daham-voc-api
```

---

## 📌 중요 파일 위치

```
~/daham_voc/
├── backend/
│   ├── .env                    # Backend 환경변수
│   ├── dist/server.js          # 빌드된 서버
│   └── prisma/schema.prisma    # DB 스키마
├── web/
│   ├── .env.local              # 로컬 개발용 환경변수
│   └── dist/                   # 빌드된 정적 파일
├── ecosystem.config.js         # PM2 설정
└── logs/                       # PM2 로그 파일
    ├── api-error.log
    ├── api-out.log
    ├── web-error.log
    └── web-out.log
```

---

## 🔄 롤백 방법

배포 후 문제가 발생했을 때:

```bash
# 1. 이전 커밋으로 되돌리기
cd ~/daham_voc
git log --oneline -5  # 최근 커밋 확인
git reset --hard <이전_커밋_해시>

# 2. 재배포
cd backend && npm install && npx prisma generate && npm run build
cd ../web && npm install && npm run build
cd ..
pm2 restart ecosystem.config.js
```

---

## 📞 도움이 필요할 때

1. **로그 확인**: `pm2 logs`로 에러 메시지 확인
2. **서비스 상태**: `pm2 status`로 프로세스 상태 확인
3. **GitHub Actions 로그**: Actions 탭에서 배포 실패 로그 확인
4. **CLAUDE.md**: 데이터베이스 관련 주의사항 확인

---

**마지막 업데이트:** 2025-01-14
