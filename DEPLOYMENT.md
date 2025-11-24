# 배포 가이드

## 📋 목차
1. [웹/백엔드 배포](#웹백엔드-배포)
   - [자동 배포 (권장)](#자동-배포-권장)
   - [수동 배포 (SSH)](#수동-배포)
2. [모바일 앱 배포](#모바일-앱-배포-expo)
3. [배포 확인](#배포-확인)
4. [트러블슈팅](#트러블슈팅)

---

# 웹/백엔드 배포

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

# 모바일 앱 배포 (Expo)

## 📱 모바일 앱 빌드 및 배포

> ⚠️ **중요**: 모바일 앱 빌드는 **로컬 PC**에서 실행해야 합니다!
> 서버(SSH)가 아닌 개발 환경에서 실행하세요.

### 사전 준비 (로컬 PC에서)
```bash
# EAS CLI 설치 (최초 1회)
npm install -g eas-cli

# 프로젝트 디렉토리로 이동 (Windows 예시)
cd C:\Users\js\Desktop\dev\daham_voc\mobile

# EAS 로그인
eas login
```

---

## 1️⃣ 버전 업데이트

**`mobile/app.json` 수정:**
```json
{
  "expo": {
    "version": "1.0.1",  // ← 버전 증가 (1.0.0 → 1.0.1)
    ...
  }
}
```

**버전 규칙:**
- 패치 업데이트: `1.0.0` → `1.0.1`
- 마이너 업데이트: `1.0.1` → `1.1.0`
- 메이저 업데이트: `1.1.0` → `2.0.0`

---

## 2️⃣ 프로덕션 빌드

### Android APK/AAB 생성

```bash
cd mobile

# 프로덕션 빌드 (AAB - 구글 플레이 업로드용)
eas build --platform android --profile production

# 또는 테스트용 APK
eas build --platform android --profile preview
```

**빌드 프로필 (`eas.json` 참고):**
- `production`: AAB 생성 → 구글 플레이 스토어 배포용
- `preview`: APK 생성 → 내부 테스트용
- `development`: 개발용 (Expo Go 없이 실행)

**빌드 시간:** 약 10-20분

**빌드 완료 후:**
1. EAS 콘솔에서 다운로드 링크 확인: https://expo.dev
2. `.aab` 또는 `.apk` 파일 다운로드

---

## 3️⃣ 구글 플레이 스토어 배포

### A. 구글 플레이 콘솔 접속

1. **URL**: https://play.google.com/console
2. 구글 개발자 계정으로 로그인
3. **"Daham VOC"** 앱 선택

### B. 현재 상태 확인

**좌측 메뉴:**
```
📱 프로덕션
   └─ 현재 버전, 상태 확인

📊 테스트
   ├─ 비공개 테스트 (클로즈드 베타)
   ├─ 공개 테스트 (오픈 베타)
   └─ 내부 테스트

⚙️ 출시
   └─ 국가/지역 선택
```

**상태 종류:**
- ✅ **공개됨**: 사용자가 다운로드 가능
- ⏳ **검토 중**: 구글 심사 대기 (보통 1-3일, 최대 7일)
- ❌ **거부됨**: 심사 실패 (이유 확인 필요)
- 📝 **초안**: 아직 제출 안 함

### C. 새 버전 업로드

**단계별 가이드:**

1. **좌측 메뉴: "프로덕션" 클릭**
2. **"새 버전 만들기" 버튼 클릭**
3. **App Bundle 업로드:**
   - EAS Build에서 다운로드한 `.aab` 파일 업로드
   - 자동으로 버전 코드 증가됨
4. **출시 노트 작성 (한국어):**
   ```
   v1.0.1 업데이트:

   ✨ 새로운 기능
   - 홈 화면에 현재 사업장 표시
   - 배정된 사업장 수 확인 가능

   🔧 개선사항
   - 사업장 선택 시 배정된 사업장만 표시
   - 로그인 시 사업장 정보 자동 로드

   🐛 버그 수정
   - 사업장 배정 연동 문제 해결
   ```
5. **변경사항 검토 클릭**
6. **"프로덕션에 출시" 클릭**

**주의사항:**
- ⚠️ versionCode는 자동 증가 (1, 2, 3, ...)
- ⚠️ versionName은 `app.json`의 `version` 값 (예: 1.0.1)
- ⚠️ 이전 버전보다 반드시 높아야 함

### D. 심사 및 배포

**심사 기간:**
- 일반적으로 1-3일 소요
- 최대 7일까지 걸릴 수 있음

**심사 중:**
- "검토 중" 상태로 표시
- 이메일로 진행 상황 알림

**승인 후:**
- 자동으로 사용자에게 업데이트 배포 (Wi-Fi 환경에서)
- 구글 플레이 스토어에서 확인 가능

---

## 4️⃣ 테스트 배포 (선택사항)

### 내부 테스트 트랙

프로덕션 배포 전 소수 테스터에게 먼저 배포:

```bash
# 내부 테스트용 빌드
eas build --platform android --profile preview
```

**구글 플레이 콘솔:**
1. 좌측 메뉴: "내부 테스트" 클릭
2. "새 버전 만들기"
3. AAB 업로드
4. 테스터 이메일 추가
5. 출시

**장점:**
- 심사 시간 짧음 (수 시간)
- 실제 환경 테스트 가능
- 프로덕션 배포 전 최종 검증

---

## 5️⃣ 빠른 명령어 모음

```bash
# 버전 확인
cd mobile
cat app.json | grep version

# 프로덕션 빌드
eas build --platform android --profile production

# 빌드 상태 확인
eas build:list

# 테스트용 APK 설치
eas build:run --platform android
```

---

## 6️⃣ 트러블슈팅

### ❌ 빌드 실패

**원인:** 캐시 문제, 의존성 충돌

**해결:**
```bash
cd mobile
rm -rf node_modules
npm install
eas build --platform android --profile production --clear-cache
```

### ❌ 구글 플레이 심사 거부

**일반적인 거부 사유:**
1. **권한 설명 부족**
   - 위치, 카메라 등 민감한 권한 사용 이유 명시 필요
   - `app.json`의 권한 설명 확인

2. **개인정보 처리방침 누락**
   - 구글 플레이 콘솔 → 앱 콘텐츠 → 개인정보처리방침 URL 입력

3. **앱 아이콘/스크린샷 문제**
   - 최소 2개 이상의 스크린샷 필요
   - 아이콘 해상도 확인 (512x512)

**해결 후 재제출:**
1. 문제 수정
2. 새 버전 빌드 (버전 코드 증가)
3. 다시 업로드

### ❌ EAS 로그인 오류

```bash
# 로그아웃 후 재로그인
eas logout
eas login
```

---

## 📊 배포 후 모니터링

### 구글 플레이 콘솔 통계

**확인할 지표:**
- 📥 설치 수
- ⭐ 평점 및 리뷰
- 🐛 비정상 종료 보고서 (ANR, 크래시)
- 📊 사용자 유지율

**접속:** https://play.google.com/console → 통계

---

**마지막 업데이트:** 2025-01-24
