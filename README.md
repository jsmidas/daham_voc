# 다함 VOC (Voice of Customer) 시스템

급식 서비스 관리 및 고객 피드백 통합 관리 시스템

---

## ⚠️ 중요: 개발 환경 설정 (CLAUDE 필독)

### 🚨 데이터베이스 중요 규칙

**이 프로젝트는 로컬 PostgreSQL을 절대 사용하지 않습니다!**

- ✅ **항상 Supabase만 사용**
- ❌ **로컬 PostgreSQL (`localhost:5432`) 사용 금지**
- ❌ **로컬 DB 데이터를 Supabase로 마이그레이션 금지**

자세한 내용은 **[DATABASE.md](DATABASE.md)** 파일을 반드시 읽어주세요.

### 데이터베이스 환경 구분

이 프로젝트는 **개발용 DB**와 **배포용 DB**를 분리하여 사용합니다.

#### 🔵 개발 환경 (Development)
- **Supabase 클라우드 PostgreSQL만 사용**
- 집/사무실 모든 환경에서 동일한 데이터로 작업
- `.env` 파일에서 `DATABASE_URL`을 Supabase 연결 문자열로 설정
- **프로젝트 정보**:
  - Supabase 프로젝트: `daham-voc-dev` (프로젝트 ID: iyussgoqhgzogjvpuxnb)
  - 계정: sos1253@gmail.com
  - 리전: Northeast Asia (Seoul)
- **설정 방법**: `docs/개발환경_설정가이드.md` 참고

#### 🟢 배포 환경 (Production)
- GCP Cloud SQL 또는 별도 운영 DB 사용
- 실제 서비스 데이터 저장
- 환경변수로 자동 전환

### 개발 시작 전 체크리스트

1. **`.env` 파일 확인**
   - `backend/.env` 파일의 `DATABASE_URL`이 Supabase로 설정되어 있는지 확인
   - Supabase 프로젝트가 없으면 `docs/개발환경_설정가이드.md` 참고

2. **패키지 설치**
   ```bash
   npm install  # 루트 디렉토리에서 실행 (모든 워크스페이스)
   ```

3. **Prisma 클라이언트 생성**
   ```bash
   cd backend
   npx prisma generate
   ```

4. **서버 실행**
   ```bash
   # 백엔드 (터미널 1)
   cd backend
   npm run dev

   # 웹 프론트엔드 (터미널 2)
   cd web
   npm run dev
   ```

---

## 프로젝트 구조

```
daham_voc/
├── backend/          # Node.js + Express + Prisma API 서버
├── web/              # React + Vite 관리자 웹 애플리케이션
├── mobile/           # React Native Expo 모바일 앱 (서브모듈)
└── docs/             # 프로젝트 문서
```

## 기술 스택

### Backend
- Node.js + Express
- PostgreSQL (Prisma ORM)
- MongoDB (로그 및 이미지 메타데이터)
- Redis (캐싱)
- GCP Storage (이미지 저장)

### Web (관리자)
- React 18 + Vite
- TypeScript
- Ant Design
- React Query
- React Router

### Mobile
- React Native Expo
- TypeScript
- React Navigation
- React Query

## 주요 기능

- 사업장 관리
- 직원 출퇴근 관리
- 식수 인원 관리
- 배식 사진 업로드
- 주간 식단표 관리
- VOC (고객 피드백) 관리
- 배송 코스 관리

## 문서

- **[DATABASE.md](DATABASE.md)** ⭐ **데이터베이스 사용 규칙 (필독!)**
- [개발 환경 설정 가이드](docs/개발환경_설정가이드.md) ⭐ **필수**
- [배송 코스 시스템 검토서](배송코스_시스템_검토서.md)
- [배송 코스 관리 구현 가이드](구현_가이드_배송코스관리.md)
- [배포 워크플로우](구현_가이드_배포_워크플로우.md)

## 환경 변수

주요 환경 변수는 `backend/.env` 파일에서 설정합니다.

```bash
# 개발 환경 예시
DATABASE_URL=postgresql://[supabase-connection-string]
NODE_ENV=development
PORT=3000
JWT_SECRET=your-secret-key
```

자세한 설정은 `backend/.env.example` 파일을 참고하세요.

## 변경 이력

### 2025.11.29

#### 웹 (Web)
- **식수 조회 페이지 전체 수정 기능 추가**
  - 개별 메뉴 수정 대신 전체 수정(Bulk Edit) 방식으로 변경
  - 날짜/끼니별로 모든 메뉴를 한 번에 수정 가능
  - 아직 입력되지 않은 메뉴도 추가 가능

- **사업장 등록 시 식수 메뉴 필수 선택**
  - 사업장 등록/수정 시 식수 메뉴를 1개 이상 반드시 선택하도록 변경
  - 모바일 앱에서 메뉴가 없어서 입력이 안 되는 상황 방지

#### 모바일 (Mobile)
- **식수 입력 UI 개선**
  - 끼니 선택 버튼(조식/중식/석식/야식) 항상 표시
  - 끼니 선택 시 모달에서 메뉴별 인원수 입력 가능
  - 복수 메뉴 동시 입력 지원

- **식수 메뉴 API 버그 수정**
  - axios default export 추가 (meal-menu.api.ts에서 apiClient가 undefined되는 문제 해결)
  - 메뉴 데이터 파싱 로직 개선 (다양한 API 응답 구조 처리)

#### 빌드 정보
- 최신 모바일 빌드: `e7b97ab8-e1e5-44e0-ab67-ecdae2b31dd3`
- 빌드 URL: https://expo.dev/accounts/jsmidas/projects/daham-voc/builds/e7b97ab8-e1e5-44e0-ab67-ecdae2b31dd3

---

## 라이선스

Private - 다함푸드시스템
