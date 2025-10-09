# Daham VOC Backend API

다함 VOC 시스템의 백엔드 API 서버입니다.

## 🚀 시작하기

### 필수 요구사항

- Node.js 18.x 이상
- PostgreSQL 15.x 이상
- npm 또는 yarn

### 설치

```bash
# 의존성 설치
npm install

# Prisma Client 생성
npx prisma generate

# 데이터베이스 마이그레이션
npx prisma migrate dev
```

### 환경 변수 설정

`.env` 파일을 생성하고 다음 내용을 설정하세요:

```env
NODE_ENV=development
PORT=3000

DATABASE_URL=postgresql://postgres:postgres@localhost:5432/daham_voc
JWT_SECRET=your_secret_key_here
JWT_EXPIRES_IN=7d

CORS_ORIGIN=http://localhost:5173
```

### 서버 실행

```bash
# 개발 모드
npm run dev

# 프로덕션 빌드
npm run build
npm start
```

## 📌 주요 기능

### 1. 인증 시스템 (Authentication)
- ✅ JWT 기반 인증
- ✅ 회원가입/로그인
- ✅ 역할 기반 권한 관리 (RBAC)
- ✅ 부문별 접근 제어 (본사/영남지사)

### 2. 사업장 관리 (Sites)
- ⏳ 사업장 CRUD
- ⏳ 사업장 그룹 관리
- ⏳ 부문별 필터링
- ⏳ 담당자 배정

### 3. 식단 관리 (Menus)
- ⏳ 식단 등록/조회/수정/삭제
- ⏳ 이미지 업로드 (GCP Storage)
- ⏳ 그룹 일괄 업로드

### 4. 식수 관리 (Meal Count) ⭐ NEW
- ✅ 식수 인원 입력
- ✅ 시간제한 기능 (조리 시작 전 마감)
- ✅ 사업장별 마감 시간 설정
- ✅ 마감 후 제출 여부 추적

**식수 관리 기능 상세:**
- 고객사가 식수 인원을 사전에 입력
- 조리 시작 시간 기준 24시간 전 마감 (설정 가능)
- 마감 후에도 입력 가능하지만 "지각" 표시
- 담당자가 정확한 조리 준비 가능

### 5. 배식 사진 관리 (Photos)
- ⏳ 사진 업로드 (GPS 좌표 포함)
- ⏳ 이미지 압축 및 썸네일 생성
- ⏳ 관리자 피드백

### 6. VOC 관리 (Feedbacks)
- ⏳ VOC 등록/조회
- ⏳ 별점 평가 시스템
- ⏳ 관리자 답변 기능
- ⏳ 담당자 평점 자동 계산

### 7. 근태 관리 (Attendance)
- ⏳ 출퇴근 체크인/체크아웃
- ⏳ GPS 좌표 기록
- ⏳ Geofencing (사업장 반경 검증)
- ⏳ 근태 통계

### 8. 통계 및 대시보드
- ⏳ 대시보드 요약 통계
- ⏳ VOC 통계
- ⏳ 평점 통계
- ⏳ 근태 통계
- ⏳ Redis 캐싱

## 🗂️ 프로젝트 구조

```
backend/
├── prisma/
│   ├── schema.prisma          # 데이터베이스 스키마
│   └── migrations/            # 마이그레이션 파일
├── src/
│   ├── config/                # 설정 파일
│   │   ├── env.ts            # 환경 변수
│   │   └── database.ts       # DB 연결
│   ├── controllers/           # API 컨트롤러
│   │   └── auth.controller.ts
│   ├── services/              # 비즈니스 로직
│   │   └── auth.service.ts
│   ├── middlewares/           # 미들웨어
│   │   ├── auth.middleware.ts
│   │   └── validator.middleware.ts
│   ├── routes/                # 라우트 정의
│   │   ├── index.ts
│   │   └── auth.routes.ts
│   ├── validators/            # 입력 검증
│   │   └── auth.validator.ts
│   ├── utils/                 # 유틸리티
│   │   ├── jwt.util.ts
│   │   ├── bcrypt.util.ts
│   │   └── api-response.util.ts
│   ├── app.ts                 # Express 앱 설정
│   └── server.ts              # 서버 시작
├── package.json
├── tsconfig.json
└── .env
```

## 📚 API 문서

### 인증 (Authentication)

#### 회원가입
```http
POST /api/v1/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "name": "홍길동",
  "phone": "010-1234-5678",
  "role": "STAFF"
}
```

#### 로그인
```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

#### 현재 사용자 조회
```http
GET /api/v1/auth/me
Authorization: Bearer <token>
```

#### 비밀번호 변경
```http
PUT /api/v1/auth/password
Authorization: Bearer <token>
Content-Type: application/json

{
  "oldPassword": "old123",
  "newPassword": "new123"
}
```

## 🛠️ 개발 도구

### Prisma Studio
데이터베이스를 GUI로 관리:
```bash
npx prisma studio
```

### 마이그레이션 생성
스키마 변경 후:
```bash
npx prisma migrate dev --name migration_name
```

## 📝 다음 단계

1. ✅ Phase 1 Week 1: 프로젝트 초기 설정 완료
   - [x] PostgreSQL + Prisma 설정
   - [x] JWT 인증 시스템
   - [x] 회원가입/로그인 API
   - [x] 식수 관리 스키마 추가

2. ⏳ Phase 1 Week 2: 사업장 관리
   - [ ] 사업장 CRUD API
   - [ ] 사업장 그룹 CRUD API
   - [ ] 식수 설정 및 입력 API
   - [ ] 부문별 필터링
   - [ ] 권한 기반 데이터 접근

3. ⏳ 다음 Phase들...

## 📖 참고 문서

- [구현 가이드 Phase 1](../구현_가이드_Phase1.md)
- [개발 가이드](../개발_가이드.md)
- [운영 가이드](../운영_가이드.md)

## 📜 라이선스

ISC
