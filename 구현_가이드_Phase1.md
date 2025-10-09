# Daham VOC 구현 가이드
## Agent 작업을 위한 상세 코딩 가이드

---

## ⚠️ 필독 - Agent 작업 규칙

### 🚨 절대 규칙
1. **파일당 2000라인 절대 초과 금지**
   - 초과 예상 시 즉시 모듈 분리
   - 라인 수 계산 후 작업 시작

2. **중복 코드 작성 절대 금지**
   - 작업 전 "파일 맵" 필독
   - 기존 코드 확인 후 작업
   - 같은 로직은 공통 모듈 사용

3. **파일 역할 준수**
   - 각 파일의 정의된 역할만 수행
   - 역할 외 코드는 해당 파일로 이동

---

## 📋 목차

1. [프로젝트 전체 구조](#1-프로젝트-전체-구조)
2. [파일 맵 - 파일별 역할 정의](#2-파일-맵---파일별-역할-정의)
3. [공통 모듈 정의](#3-공통-모듈-정의)
4. [Phase별 구현 순서](#4-phase별-구현-순서)
5. [중복 방지 체크리스트](#5-중복-방지-체크리스트)

---

## 1. 프로젝트 전체 구조

```
daham_voc/
├── backend/                 # Node.js + Express 백엔드
│   ├── src/
│   │   ├── config/         # 설정 파일 (DB, Redis, GCP 등)
│   │   ├── models/         # 데이터 모델 (Prisma, Mongoose)
│   │   ├── controllers/    # API 엔드포인트 로직
│   │   ├── services/       # 비즈니스 로직
│   │   ├── middlewares/    # 미들웨어 (인증, 에러 등)
│   │   ├── routes/         # 라우팅 정의
│   │   ├── utils/          # 공통 유틸리티
│   │   ├── validators/     # 입력 검증
│   │   └── app.ts          # Express 앱 설정
│   ├── prisma/
│   │   └── schema.prisma   # PostgreSQL 스키마
│   ├── package.json
│   └── tsconfig.json
│
├── web/                    # React 웹 (관리자용)
│   ├── src/
│   │   ├── components/     # 재사용 컴포넌트
│   │   ├── pages/          # 페이지 컴포넌트
│   │   ├── hooks/          # 커스텀 훅
│   │   ├── services/       # API 호출
│   │   ├── stores/         # Zustand 스토어
│   │   ├── types/          # TypeScript 타입
│   │   ├── utils/          # 공통 유틸리티
│   │   └── App.tsx
│   ├── package.json
│   └── tsconfig.json
│
├── mobile/                 # React Native 모바일
│   ├── src/
│   │   ├── components/     # 재사용 컴포넌트
│   │   ├── screens/        # 화면 컴포넌트
│   │   ├── navigation/     # 네비게이션 설정
│   │   ├── hooks/          # 커스텀 훅
│   │   ├── services/       # API 호출
│   │   ├── stores/         # Context API 스토어
│   │   ├── types/          # TypeScript 타입
│   │   ├── utils/          # 공통 유틸리티
│   │   └── App.tsx
│   ├── package.json
│   └── tsconfig.json
│
├── 개발_가이드.md          # 기술 스택, DB 설계
├── 운영_가이드.md          # 사용자 가이드
└── 구현_가이드.md          # 이 파일 (구현 상세)
```

---

## 2. 파일 맵 - 파일별 역할 정의

### 📖 이 섹션을 반드시 읽고 작업하세요
**새로운 agent가 작업 시작 전 필독!**

### 2.1 Backend 파일 맵

#### 📁 `backend/src/config/` (설정 파일)

| 파일명 | 최대 라인 | 역할 | 담당 내용 |
|--------|-----------|------|-----------|
| `database.ts` | 150 | PostgreSQL 연결 설정 | Prisma Client 초기화, 연결 풀 설정 |
| `mongodb.ts` | 100 | MongoDB 연결 설정 | Mongoose 연결, 이미지 메타데이터 저장용 |
| `redis.ts` | 100 | Redis 연결 설정 | 캐시 클라이언트 초기화 |
| `gcp-storage.ts` | 200 | GCP Storage 설정 | Storage 클라이언트, 버킷 설정 |
| `env.ts` | 150 | 환경 변수 관리 | process.env 타입 정의 및 검증 |

**⚠️ 주의:**
- DB 연결 코드는 이 폴더에만 작성
- 다른 곳에서 직접 연결하지 말 것

---

#### 📁 `backend/src/models/` (데이터 모델)

| 파일명 | 최대 라인 | 역할 | 담당 내용 |
|--------|-----------|------|-----------|
| `prisma/schema.prisma` | 1500 | PostgreSQL 스키마 정의 | User, Site, Menu, MealPhoto, CustomerFeedback, Staff, Attendance, SiteGroup 모델 |
| `image-meta.model.ts` | 200 | MongoDB 이미지 메타데이터 | Mongoose 스키마, 이미지 업로드 정보 |

**⚠️ 주의:**
- Prisma 스키마는 한 파일에 모든 모델 포함
- 1500라인 초과 시 `// ===== 섹션명 =====`으로 구분

---

#### 📁 `backend/src/controllers/` (API 컨트롤러)

**각 도메인별로 파일 분리 - 500라인 제한**

| 파일명 | 최대 라인 | 역할 | API 엔드포인트 |
|--------|-----------|------|----------------|
| `auth.controller.ts` | 400 | 인증 관련 | `/api/v1/auth/*` |
| `site.controller.ts` | 500 | 사업장 관리 | `/api/v1/sites/*` |
| `site-group.controller.ts` | 400 | 사업장 그룹 관리 | `/api/v1/site-groups/*` |
| `menu.controller.ts` | 500 | 식단 관리 | `/api/v1/menus/*` |
| `photo.controller.ts` | 500 | 배식 사진 관리 | `/api/v1/photos/*` |
| `feedback.controller.ts` | 500 | VOC 관리 | `/api/v1/feedbacks/*` |
| `staff.controller.ts` | 400 | 담당자 관리 | `/api/v1/staff/*` |
| `attendance.controller.ts` | 500 | 근태 관리 | `/api/v1/attendance/*` |
| `stats.controller.ts` | 400 | 통계 조회 | `/api/v1/stats/*` |

**⚠️ 주의:**
- 컨트롤러는 요청/응답 처리만
- 비즈니스 로직은 service로 이동

**컨트롤러 구조 예시:**
```typescript
// site.controller.ts (Lines 1-50)
import { Request, Response } from 'express';
import { SiteService } from '../services/site.service';

export class SiteController {
  // Lines 10-30: GET /api/v1/sites
  async getSites(req: Request, res: Response) {
    // 요청 파라미터 파싱
    // SiteService 호출
    // 응답 반환
  }

  // Lines 35-55: POST /api/v1/sites
  async createSite(req: Request, res: Response) {
    // ...
  }
}
```

---

#### 📁 `backend/src/services/` (비즈니스 로직)

**각 도메인별로 파일 분리 - 800라인 제한**

| 파일명 | 최대 라인 | 역할 | 담당 로직 |
|--------|-----------|------|-----------|
| `auth.service.ts` | 600 | 인증 로직 | 로그인, JWT 발급, 비밀번호 검증 |
| `site.service.ts` | 800 | 사업장 비즈니스 로직 | CRUD, 검색, 필터링, 부문별 조회 |
| `site-group.service.ts` | 600 | 사업장 그룹 로직 | 그룹 CRUD, 멤버 관리 |
| `menu.service.ts` | 800 | 식단 비즈니스 로직 | 이미지 업로드, 일괄 등록, 조회 |
| `photo.service.ts` | 800 | 사진 비즈니스 로직 | 업로드, GPS 검증, 압축, 피드백 |
| `feedback.service.ts` | 700 | VOC 비즈니스 로직 | 등록, 조회, 답변, 상태 관리 |
| `staff.service.ts` | 600 | 담당자 비즈니스 로직 | 정보 관리, 평점 계산, 사업장 배정 |
| `attendance.service.ts` | 700 | 근태 비즈니스 로직 | 체크인/아웃, GPS 검증, Geofencing |
| `stats.service.ts` | 600 | 통계 로직 | 대시보드 데이터, 집계 |
| `image.service.ts` | 600 | 이미지 처리 로직 | GCP 업로드, 압축, 썸네일 생성 |
| `notification.service.ts` | 400 | 알림 로직 | VOC 알림, 미처리 알림 |

**⚠️ 주의:**
- Service는 DB 접근 및 비즈니스 로직 담당
- 외부 API 호출도 여기서

**Service 구조 예시:**
```typescript
// site.service.ts (Lines 1-100)
import { PrismaClient } from '@prisma/client';
import { RedisClient } from '../config/redis';

export class SiteService {
  private prisma: PrismaClient;
  private redis: RedisClient;

  // Lines 10-50: 사업장 목록 조회 (필터링, 페이징)
  async getSites(filters, pagination) {
    // 캐시 확인
    // DB 조회
    // 캐시 저장
    // 반환
  }

  // Lines 55-85: 사업장 생성
  async createSite(data) {
    // 검증
    // DB 저장
    // 캐시 무효화
  }
}
```

---

#### 📁 `backend/src/middlewares/` (미들웨어)

| 파일명 | 최대 라인 | 역할 | 담당 내용 |
|--------|-----------|------|-----------|
| `auth.middleware.ts` | 300 | JWT 인증 검증 | 토큰 검증, req.user 설정 |
| `role.middleware.ts` | 200 | 역할 기반 권한 검증 | RBAC, 부문별 접근 제어 |
| `error.middleware.ts` | 300 | 에러 핸들링 | 전역 에러 처리, 로깅 |
| `validator.middleware.ts` | 200 | 입력 검증 미들웨어 | Joi/Zod 스키마 검증 |
| `rate-limit.middleware.ts` | 150 | Rate Limiting | API 호출 제한 |
| `logger.middleware.ts` | 150 | 로깅 | 요청/응답 로깅 |

**⚠️ 주의:**
- 미들웨어는 재사용 가능하게 작성
- 순서: logger → auth → role → validator

---

#### 📁 `backend/src/routes/` (라우팅)

**각 도메인별로 파일 분리 - 200라인 제한**

| 파일명 | 최대 라인 | 역할 |
|--------|-----------|------|
| `index.ts` | 150 | 메인 라우터 통합 |
| `auth.routes.ts` | 150 | 인증 라우트 |
| `site.routes.ts` | 200 | 사업장 라우트 |
| `site-group.routes.ts` | 150 | 사업장 그룹 라우트 |
| `menu.routes.ts` | 200 | 식단 라우트 |
| `photo.routes.ts` | 200 | 사진 라우트 |
| `feedback.routes.ts` | 200 | VOC 라우트 |
| `staff.routes.ts` | 150 | 담당자 라우트 |
| `attendance.routes.ts` | 200 | 근태 라우트 |
| `stats.routes.ts` | 150 | 통계 라우트 |

**라우트 구조 예시:**
```typescript
// site.routes.ts (Lines 1-50)
import { Router } from 'express';
import { SiteController } from '../controllers/site.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { roleMiddleware } from '../middlewares/role.middleware';

const router = Router();
const controller = new SiteController();

// Lines 10-15: GET /api/v1/sites
router.get('/', authMiddleware, controller.getSites);

// Lines 17-22: POST /api/v1/sites (ADMIN only)
router.post('/', authMiddleware, roleMiddleware(['ADMIN']), controller.createSite);

export default router;
```

---

#### 📁 `backend/src/utils/` (공통 유틸리티)

| 파일명 | 최대 라인 | 역할 | 담당 내용 |
|--------|-----------|------|-----------|
| `jwt.util.ts` | 200 | JWT 토큰 관리 | 생성, 검증, 갱신 |
| `bcrypt.util.ts` | 100 | 비밀번호 암호화 | 해싱, 비교 |
| `pagination.util.ts` | 150 | 페이지네이션 | 오프셋 계산, 메타 생성 |
| `geofencing.util.ts` | 300 | GPS 검증 | 거리 계산, 반경 체크 |
| `date.util.ts` | 200 | 날짜 유틸 | 포맷팅, 계산 |
| `file.util.ts` | 250 | 파일 처리 | 확장자 검증, 크기 체크 |
| `error.util.ts` | 200 | 에러 생성 | 커스텀 에러 클래스 |

**⚠️ 주의:**
- 공통 로직만 여기에 작성
- 순수 함수로 작성 (side-effect 없음)

---

#### 📁 `backend/src/validators/` (입력 검증)

| 파일명 | 최대 라인 | 역할 |
|--------|-----------|------|
| `auth.validator.ts` | 200 | 인증 입력 검증 |
| `site.validator.ts` | 300 | 사업장 입력 검증 |
| `menu.validator.ts` | 250 | 식단 입력 검증 |
| `photo.validator.ts` | 250 | 사진 입력 검증 |
| `feedback.validator.ts` | 250 | VOC 입력 검증 |
| `attendance.validator.ts` | 250 | 근태 입력 검증 |

**검증 예시:**
```typescript
// site.validator.ts (Lines 1-50)
import Joi from 'joi';

// Lines 5-25: 사업장 생성 스키마
export const createSiteSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  type: Joi.string().valid('CONSIGNMENT', 'DELIVERY', 'LUNCHBOX', 'EVENT').required(),
  division: Joi.string().valid('HQ', 'YEONGNAM').required(),
  address: Joi.string().required(),
  latitude: Joi.number().min(-90).max(90).required(),
  longitude: Joi.number().min(-180).max(180).required(),
  // ...
});

// Lines 30-50: 사업장 조회 쿼리 스키마
export const getSitesQuerySchema = Joi.object({
  type: Joi.string().valid('CONSIGNMENT', 'DELIVERY', 'LUNCHBOX', 'EVENT'),
  division: Joi.string().valid('HQ', 'YEONGNAM'),
  page: Joi.number().min(1).default(1),
  limit: Joi.number().min(1).max(100).default(20),
});
```

---

### 2.2 Web Frontend 파일 맵

#### 📁 `web/src/components/` (재사용 컴포넌트)

**UI 컴포넌트 - 300라인 제한**

| 파일명 | 최대 라인 | 역할 |
|--------|-----------|------|
| `Layout/MainLayout.tsx` | 250 | 메인 레이아웃 (헤더, 사이드바) |
| `Layout/AuthLayout.tsx` | 150 | 인증 레이아웃 (로그인 페이지용) |
| `Table/DataTable.tsx` | 300 | 재사용 테이블 (정렬, 페이징) |
| `Form/SiteForm.tsx` | 300 | 사업장 등록/수정 폼 |
| `Form/MenuUploadForm.tsx` | 300 | 식단 업로드 폼 |
| `Modal/ConfirmModal.tsx` | 150 | 확인 모달 |
| `Modal/ImageModal.tsx` | 200 | 이미지 확대 모달 |
| `Card/SiteCard.tsx` | 150 | 사업장 카드 |
| `Card/StatCard.tsx` | 150 | 통계 카드 |
| `Filter/SiteFilter.tsx` | 250 | 사업장 필터 |
| `Map/KakaoMap.tsx` | 300 | 카카오맵 컴포넌트 |

**⚠️ 주의:**
- 컴포넌트는 300라인 초과 시 분리
- Props 타입은 `types/` 폴더에 정의

---

#### 📁 `web/src/pages/` (페이지 컴포넌트)

**페이지별 파일 - 400라인 제한**

| 파일명 | 최대 라인 | 역할 | 라우트 |
|--------|-----------|------|--------|
| `Login.tsx` | 200 | 로그인 페이지 | `/login` |
| `Dashboard.tsx` | 400 | 대시보드 | `/` |
| `Sites/SiteList.tsx` | 400 | 사업장 목록 | `/sites` |
| `Sites/SiteDetail.tsx` | 350 | 사업장 상세 | `/sites/:id` |
| `SiteGroups/SiteGroupList.tsx` | 400 | 사업장 그룹 목록 | `/site-groups` |
| `Menus/MenuList.tsx` | 400 | 식단 목록 | `/menus` |
| `Photos/PhotoList.tsx` | 400 | 사진 목록 | `/photos` |
| `Feedbacks/FeedbackList.tsx` | 400 | VOC 목록 | `/feedbacks` |
| `Staff/StaffList.tsx` | 400 | 담당자 목록 | `/staff` |
| `Attendance/AttendanceList.tsx` | 400 | 근태 목록 | `/attendance` |
| `Stats/StatsView.tsx` | 400 | 통계 조회 | `/stats` |

**⚠️ 주의:**
- 페이지는 비즈니스 로직 최소화
- 데이터 로딩은 hooks 사용

---

#### 📁 `web/src/services/` (API 호출)

**API 클라이언트 - 각 400라인 제한**

| 파일명 | 최대 라인 | 역할 |
|--------|-----------|------|
| `api.ts` | 200 | Axios 인스턴스, 인터셉터 |
| `auth.service.ts` | 250 | 인증 API 호출 |
| `site.service.ts` | 400 | 사업장 API 호출 |
| `site-group.service.ts` | 300 | 사업장 그룹 API 호출 |
| `menu.service.ts` | 400 | 식단 API 호출 |
| `photo.service.ts` | 400 | 사진 API 호출 |
| `feedback.service.ts` | 400 | VOC API 호출 |
| `staff.service.ts` | 300 | 담당자 API 호출 |
| `attendance.service.ts` | 350 | 근태 API 호출 |
| `stats.service.ts` | 300 | 통계 API 호출 |

**API Service 예시:**
```typescript
// site.service.ts (Lines 1-100)
import { api } from './api';
import { Site, SiteCreateDto, SiteUpdateDto, SiteFilter } from '../types/site';

// Lines 5-20: 사업장 목록 조회
export const getSites = async (filter?: SiteFilter) => {
  const response = await api.get<{ data: Site[]; meta: any }>('/api/v1/sites', {
    params: filter,
  });
  return response.data;
};

// Lines 25-35: 사업장 생성
export const createSite = async (data: SiteCreateDto) => {
  const response = await api.post<{ data: Site }>('/api/v1/sites', data);
  return response.data;
};
```

---

#### 📁 `web/src/hooks/` (커스텀 훅)

| 파일명 | 최대 라인 | 역할 |
|--------|-----------|------|
| `useSites.ts` | 300 | 사업장 데이터 훅 (React Query) |
| `useSiteGroups.ts` | 250 | 사업장 그룹 데이터 훅 |
| `useMenus.ts` | 300 | 식단 데이터 훅 |
| `usePhotos.ts` | 300 | 사진 데이터 훅 |
| `useFeedbacks.ts` | 300 | VOC 데이터 훅 |
| `useAuth.ts` | 250 | 인증 상태 훅 |
| `useImageUpload.ts` | 250 | 이미지 업로드 훅 |

**Hook 예시:**
```typescript
// useSites.ts (Lines 1-80)
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSites, createSite, updateSite, deleteSite } from '../services/site.service';

// Lines 5-20: 사업장 목록 조회 훅
export const useSites = (filter?: SiteFilter) => {
  return useQuery({
    queryKey: ['sites', filter],
    queryFn: () => getSites(filter),
  });
};

// Lines 25-45: 사업장 생성 훅
export const useCreateSite = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createSite,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sites'] });
    },
  });
};
```

---

### 2.3 Mobile App 파일 맵

#### 📁 `mobile/src/screens/` (화면 컴포넌트)

**화면별 파일 - 500라인 제한**

| 파일명 | 최대 라인 | 역할 |
|--------|-----------|------|
| `Auth/LoginScreen.tsx` | 300 | 로그인 화면 |
| `Home/HomeScreen.tsx` | 400 | 홈 화면 (담당자/고객사) |
| `Attendance/CheckInScreen.tsx` | 400 | 출근 체크인 화면 (GPS) |
| `Attendance/CheckOutScreen.tsx` | 350 | 퇴근 체크아웃 화면 |
| `Menu/MenuListScreen.tsx` | 400 | 식단 조회 화면 |
| `Menu/MenuDetailScreen.tsx` | 350 | 식단 상세 (이미지 확대) |
| `Photo/CameraScreen.tsx` | 500 | 사진 촬영 화면 |
| `Photo/PhotoListScreen.tsx` | 400 | 사진 목록 화면 |
| `Photo/PhotoDetailScreen.tsx` | 400 | 사진 상세/수정 화면 |
| `Feedback/FeedbackListScreen.tsx` | 400 | VOC 목록 화면 |
| `Feedback/FeedbackWriteScreen.tsx` | 400 | VOC 작성 화면 |

**⚠️ 주의:**
- 화면은 500라인 초과 시 컴포넌트 분리
- 비즈니스 로직은 hooks로 이동

---

#### 📁 `mobile/src/services/` (API 호출)

| 파일명 | 최대 라인 | 역할 |
|--------|-----------|------|
| `api.ts` | 250 | Axios 인스턴스, 토큰 관리 |
| `auth.service.ts` | 250 | 인증 API |
| `menu.service.ts` | 300 | 식단 API |
| `photo.service.ts` | 400 | 사진 API (업로드 포함) |
| `feedback.service.ts` | 350 | VOC API |
| `attendance.service.ts` | 350 | 근태 API |

---

## 3. 공통 모듈 정의

### 3.1 중복 방지 - 공통으로 사용할 모듈

#### 📦 Backend 공통 모듈

**위치: `backend/src/utils/`**

| 모듈명 | 파일 | 용도 | 사용처 |
|--------|------|------|--------|
| `apiResponse.util.ts` | 150 라인 | 표준 API 응답 포맷 | 모든 컨트롤러 |
| `pagination.util.ts` | 150 라인 | 페이지네이션 계산 | 목록 조회 API |
| `filter.util.ts` | 200 라인 | 동적 필터 생성 | 검색 기능 |
| `jwt.util.ts` | 200 라인 | JWT 토큰 관리 | 인증 관련 |
| `geofencing.util.ts` | 300 라인 | GPS 거리 계산 | 근태, 사진 업로드 |
| `image-processor.util.ts` | 300 라인 | 이미지 압축, 썸네일 | 사진/식단 업로드 |
| `gcp-uploader.util.ts` | 250 라인 | GCP Storage 업로드 | 사진/식단 업로드 |

**⚠️ 절대 규칙:**
- JWT 발급은 `jwt.util.ts`에서만
- GPS 계산은 `geofencing.util.ts`에서만
- 이미지 처리는 `image-processor.util.ts`에서만
- **절대 다른 곳에 중복 작성 금지**

**공통 모듈 사용 예시:**
```typescript
// photo.service.ts에서 사용
import { uploadToGCP } from '../utils/gcp-uploader.util';
import { processImage } from '../utils/image-processor.util';
import { checkGeofence } from '../utils/geofencing.util';

// 이미지 업로드 로직
const processedImage = await processImage(file);  // 공통 모듈 사용
const url = await uploadToGCP(processedImage);     // 공통 모듈 사용
const isInSite = checkGeofence(lat, lng, siteCoords); // 공통 모듈 사용
```

---

#### 📦 Frontend 공통 모듈

**위치: `web/src/utils/` 및 `mobile/src/utils/`**

| 모듈명 | 파일 | 용도 | 사용처 |
|--------|------|------|--------|
| `format.util.ts` | 200 라인 | 날짜, 숫자 포맷팅 | 모든 컴포넌트 |
| `validation.util.ts` | 250 라인 | 클라이언트 입력 검증 | 폼 컴포넌트 |
| `storage.util.ts` | 150 라인 | 로컬 스토리지 관리 | 인증, 설정 |
| `error-handler.util.ts` | 200 라인 | 에러 메시지 변환 | API 호출 시 |

---

### 3.2 타입 정의 공유

**위치: `backend/src/types/` 및 `web/src/types/`**

| 파일명 | 최대 라인 | 역할 |
|--------|-----------|------|
| `common.types.ts` | 200 | 공통 타입 (Pagination, ApiResponse 등) |
| `site.types.ts` | 300 | 사업장 관련 타입 |
| `menu.types.ts` | 250 | 식단 관련 타입 |
| `photo.types.ts` | 250 | 사진 관련 타입 |
| `feedback.types.ts` | 250 | VOC 관련 타입 |
| `user.types.ts` | 200 | 사용자 관련 타입 |

**⚠️ 주의:**
- 타입은 한 곳에서만 정의
- Backend와 Frontend 타입 동기화 필수

---

## 4. Phase별 구현 순서

### Phase 1: 기본 인프라 (2주)

#### Week 1-1: 프로젝트 초기 설정

**작업 1: Backend 프로젝트 생성**

```bash
# 명령어
mkdir backend && cd backend
npm init -y
npm install express prisma @prisma/client typescript ts-node
npm install -D @types/node @types/express nodemon
```

**생성할 파일 및 라인 수:**

| 파일명 | 예상 라인 | 작업 내용 |
|--------|-----------|-----------|
| `package.json` | 50 | 의존성, 스크립트 설정 |
| `tsconfig.json` | 30 | TypeScript 설정 |
| `src/app.ts` | 100 | Express 앱 기본 설정 |
| `src/server.ts` | 50 | 서버 시작 |
| `.env.example` | 30 | 환경 변수 템플릿 |
| `.gitignore` | 20 | Git 무시 파일 |

**총 라인 수: ~280라인**

---

**작업 2: PostgreSQL + Prisma 설정**

**파일: `prisma/schema.prisma`**
```prisma
// Lines 1-50: 기본 설정
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// Lines 55-150: User 모델
model User {
  id            String      @id @default(uuid())
  email         String      @unique
  password      String
  name          String
  phone         String?
  role          Role        @default(STAFF)
  division      Division?
  isActive      Boolean     @default(true)
  lastLoginAt   DateTime?
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt
  deletedAt     DateTime?

  staff         Staff?
  feedbacks     CustomerFeedback[]
  mealPhotos    MealPhoto[]
  attendances   Attendance[]

  @@index([email])
  @@index([role])
  @@index([division])
}

// Lines 155-180: Role Enum
enum Role {
  SUPER_ADMIN
  HQ_ADMIN
  YEONGNAM_ADMIN
  STAFF
  CLIENT
}

// Lines 185-195: Division Enum
enum Division {
  HQ
  YEONGNAM
}
```

**예상 라인: 200라인 (User 모델만)**
**나머지 모델은 다음 작업에서 추가**

---

**작업 3: 환경 변수 설정**

**파일: `backend/src/config/env.ts`** (Lines 1-150)
```typescript
// Lines 1-50: 환경 변수 타입 정의
export interface EnvConfig {
  NODE_ENV: 'development' | 'production' | 'test';
  PORT: number;
  DATABASE_URL: string;
  MONGODB_URI: string;
  REDIS_URL: string;
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string;
  GCP_PROJECT_ID: string;
  GCP_BUCKET_NAME: string;
  GCP_KEY_FILE: string;
}

// Lines 55-100: 환경 변수 파싱 및 검증
export const env: EnvConfig = {
  NODE_ENV: process.env.NODE_ENV as any || 'development',
  PORT: parseInt(process.env.PORT || '3000', 10),
  DATABASE_URL: process.env.DATABASE_URL!,
  MONGODB_URI: process.env.MONGODB_URI!,
  // ...
};

// Lines 105-150: 환경 변수 검증 함수
export function validateEnv(): void {
  const required = ['DATABASE_URL', 'JWT_SECRET', 'GCP_PROJECT_ID'];
  for (const key of required) {
    if (!process.env[key]) {
      throw new Error(`Missing required environment variable: ${key}`);
    }
  }
}
```

**예상 라인: 150라인**

---

**작업 4: Database 연결 설정**

**파일: `backend/src/config/database.ts`** (Lines 1-100)
```typescript
// Lines 1-30: Prisma Client 초기화
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

// Lines 35-60: 연결 테스트
export async function connectDatabase(): Promise<void> {
  try {
    await prisma.$connect();
    console.log('✅ PostgreSQL connected');
  } catch (error) {
    console.error('❌ PostgreSQL connection failed:', error);
    process.exit(1);
  }
}

// Lines 65-85: Graceful shutdown
export async function disconnectDatabase(): Promise<void> {
  await prisma.$disconnect();
  console.log('PostgreSQL disconnected');
}

// Lines 90-100: Export
export { prisma };
```

**예상 라인: 100라인**

---

**작업 5: MongoDB 연결 설정**

**파일: `backend/src/config/mongodb.ts`** (Lines 1-80)
```typescript
// Lines 1-30: Mongoose 연결
import mongoose from 'mongoose';
import { env } from './env';

export async function connectMongoDB(): Promise<void> {
  try {
    await mongoose.connect(env.MONGODB_URI);
    console.log('✅ MongoDB connected');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    process.exit(1);
  }
}

// Lines 35-60: 이미지 메타데이터 스키마
import { Schema, model } from 'mongoose';

const imageMetaSchema = new Schema({
  fileId: { type: String, required: true, unique: true },
  originalName: String,
  mimeType: String,
  size: Number,
  width: Number,
  height: Number,
  uploadedBy: String,
  createdAt: { type: Date, default: Date.now },
});

// Lines 65-80: Export
export const ImageMeta = model('ImageMeta', imageMetaSchema);
export { mongoose };
```

**예상 라인: 80라인**

---

#### Week 1-2: 인증 시스템 구축

**작업 6: JWT 유틸리티**

**파일: `backend/src/utils/jwt.util.ts`** (Lines 1-150)
```typescript
// Lines 1-30: Import
import jwt from 'jsonwebtoken';
import { env } from '../config/env';

// Lines 35-70: JWT 발급
export function generateToken(payload: TokenPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  });
}

// Lines 75-110: JWT 검증
export function verifyToken(token: string): TokenPayload {
  try {
    return jwt.verify(token, env.JWT_SECRET) as TokenPayload;
  } catch (error) {
    throw new Error('Invalid token');
  }
}

// Lines 115-150: JWT 갱신
export function refreshToken(oldToken: string): string {
  const payload = verifyToken(oldToken);
  return generateToken({
    userId: payload.userId,
    email: payload.email,
    role: payload.role,
  });
}
```

**예상 라인: 150라인**

---

**작업 7: 비밀번호 암호화 유틸리티**

**파일: `backend/src/utils/bcrypt.util.ts`** (Lines 1-80)
```typescript
// Lines 1-20: Import
import bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;

// Lines 25-45: 비밀번호 해싱
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

// Lines 50-70: 비밀번호 비교
export async function comparePassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}
```

**예상 라인: 80라인**

---

**작업 8: Auth Service**

**파일: `backend/src/services/auth.service.ts`** (Lines 1-400)
```typescript
// Lines 1-50: Import 및 클래스 선언
import { prisma } from '../config/database';
import { hashPassword, comparePassword } from '../utils/bcrypt.util';
import { generateToken } from '../utils/jwt.util';

export class AuthService {
  // Lines 55-100: 회원가입
  async register(data: RegisterDto): Promise<{ user: User; token: string }> {
    // 이메일 중복 체크
    const exists = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (exists) {
      throw new Error('Email already exists');
    }

    // 비밀번호 해싱
    const hashedPassword = await hashPassword(data.password);

    // 사용자 생성
    const user = await prisma.user.create({
      data: {
        ...data,
        password: hashedPassword,
      },
    });

    // JWT 발급
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    return { user, token };
  }

  // Lines 105-160: 로그인
  async login(email: string, password: string): Promise<{ user: User; token: string }> {
    // 사용자 조회
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new Error('Invalid credentials');
    }

    // 비활성 계정 체크
    if (!user.isActive) {
      throw new Error('Account is inactive');
    }

    // 비밀번호 검증
    const isValid = await comparePassword(password, user.password);

    if (!isValid) {
      throw new Error('Invalid credentials');
    }

    // 마지막 로그인 시간 업데이트
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // JWT 발급
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    return { user, token };
  }

  // Lines 165-200: 비밀번호 변경
  async changePassword(
    userId: string,
    oldPassword: string,
    newPassword: string
  ): Promise<void> {
    // 사용자 조회
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // 기존 비밀번호 검증
    const isValid = await comparePassword(oldPassword, user.password);

    if (!isValid) {
      throw new Error('Current password is incorrect');
    }

    // 새 비밀번호 해싱 및 저장
    const hashedPassword = await hashPassword(newPassword);

    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });
  }

  // Lines 205-240: 현재 사용자 조회
  async getCurrentUser(userId: string): Promise<User> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        staff: true,
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    return user;
  }
}
```

**예상 라인: 400라인**
**⚠️ 400라인이므로 제한 내**

---

**작업 9: Auth Controller**

**파일: `backend/src/controllers/auth.controller.ts`** (Lines 1-300)
```typescript
// Lines 1-30: Import
import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { successResponse, errorResponse } from '../utils/api-response.util';

export class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  // Lines 35-75: POST /api/v1/auth/register
  async register(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.authService.register(req.body);

      res.status(201).json(successResponse(result, 'Registration successful'));
    } catch (error) {
      res.status(400).json(errorResponse(error.message));
    }
  }

  // Lines 80-120: POST /api/v1/auth/login
  async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;
      const result = await this.authService.login(email, password);

      res.json(successResponse(result, 'Login successful'));
    } catch (error) {
      res.status(401).json(errorResponse(error.message));
    }
  }

  // Lines 125-160: GET /api/v1/auth/me
  async getCurrentUser(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user.userId; // authMiddleware에서 설정
      const user = await this.authService.getCurrentUser(userId);

      res.json(successResponse(user));
    } catch (error) {
      res.status(404).json(errorResponse(error.message));
    }
  }

  // Lines 165-200: PUT /api/v1/auth/password
  async changePassword(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user.userId;
      const { oldPassword, newPassword } = req.body;

      await this.authService.changePassword(userId, oldPassword, newPassword);

      res.json(successResponse(null, 'Password changed successfully'));
    } catch (error) {
      res.status(400).json(errorResponse(error.message));
    }
  }
}
```

**예상 라인: 300라인**

---

**작업 10: Auth Middleware**

**파일: `backend/src/middlewares/auth.middleware.ts`** (Lines 1-200)
```typescript
// Lines 1-30: Import
import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt.util';
import { errorResponse } from '../utils/api-response.util';

// Lines 35-80: JWT 인증 미들웨어
export async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Authorization 헤더에서 토큰 추출
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json(errorResponse('No token provided'));
      return;
    }

    const token = authHeader.substring(7);

    // 토큰 검증
    const payload = verifyToken(token);

    // req.user에 payload 설정
    req.user = payload;

    next();
  } catch (error) {
    res.status(401).json(errorResponse('Invalid token'));
  }
}

// Lines 85-130: 역할 기반 권한 미들웨어
export function roleMiddleware(allowedRoles: Role[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const userRole = req.user?.role;

      if (!userRole) {
        res.status(401).json(errorResponse('Unauthorized'));
        return;
      }

      if (!allowedRoles.includes(userRole)) {
        res.status(403).json(errorResponse('Forbidden'));
        return;
      }

      next();
    } catch (error) {
      res.status(500).json(errorResponse('Internal server error'));
    }
  };
}

// Lines 135-180: 부문 기반 접근 제어
export function divisionMiddleware(req: Request, res: Response, next: NextFunction): void {
  try {
    const userRole = req.user?.role;
    const userDivision = req.user?.division;

    // SUPER_ADMIN은 모든 부문 접근 가능
    if (userRole === 'SUPER_ADMIN') {
      next();
      return;
    }

    // HQ_ADMIN은 본사만, YEONGNAM_ADMIN은 영남지사만
    if (userRole === 'HQ_ADMIN' && userDivision !== 'HQ') {
      res.status(403).json(errorResponse('Access denied'));
      return;
    }

    if (userRole === 'YEONGNAM_ADMIN' && userDivision !== 'YEONGNAM') {
      res.status(403).json(errorResponse('Access denied'));
      return;
    }

    next();
  } catch (error) {
    res.status(500).json(errorResponse('Internal server error'));
  }
}
```

**예상 라인: 200라인**

---

**작업 11: Auth Routes**

**파일: `backend/src/routes/auth.routes.ts`** (Lines 1-80)
```typescript
// Lines 1-20: Import
import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { validateRequest } from '../middlewares/validator.middleware';
import { registerSchema, loginSchema, changePasswordSchema } from '../validators/auth.validator';

// Lines 25-35: Router 초기화
const router = Router();
const controller = new AuthController();

// Lines 40-45: POST /api/v1/auth/register
router.post(
  '/register',
  validateRequest(registerSchema),
  controller.register.bind(controller)
);

// Lines 50-55: POST /api/v1/auth/login
router.post(
  '/login',
  validateRequest(loginSchema),
  controller.login.bind(controller)
);

// Lines 60-65: GET /api/v1/auth/me
router.get(
  '/me',
  authMiddleware,
  controller.getCurrentUser.bind(controller)
);

// Lines 70-75: PUT /api/v1/auth/password
router.put(
  '/password',
  authMiddleware,
  validateRequest(changePasswordSchema),
  controller.changePassword.bind(controller)
);

// Lines 80: Export
export default router;
```

**예상 라인: 80라인**

---

**작업 12: API Response 공통 유틸**

**파일: `backend/src/utils/api-response.util.ts`** (Lines 1-120)
```typescript
// Lines 1-20: 타입 정의
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: PaginationMeta;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// Lines 25-50: 성공 응답 생성
export function successResponse<T>(
  data: T,
  message?: string,
  meta?: PaginationMeta
): ApiResponse<T> {
  return {
    success: true,
    data,
    ...(meta && { meta }),
  };
}

// Lines 55-85: 에러 응답 생성
export function errorResponse(
  message: string,
  code = 'ERROR',
  details?: any
): ApiResponse {
  return {
    success: false,
    error: {
      code,
      message,
      ...(details && { details }),
    },
  };
}

// Lines 90-120: 페이지네이션 메타 생성
export function createPaginationMeta(
  page: number,
  limit: number,
  total: number
): PaginationMeta {
  return {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  };
}
```

**예상 라인: 120라인**

---

### ✅ Week 1 완료 시점 체크리스트

- [ ] Backend 프로젝트 구조 생성 완료
- [ ] PostgreSQL + Prisma 연결 완료
- [ ] MongoDB 연결 완료
- [ ] JWT 인증 시스템 구현 완료
- [ ] 회원가입/로그인 API 작동 테스트 완료
- [ ] 환경 변수 설정 완료

**총 파일 수: 12개**
**총 예상 라인 수: ~2,000라인**

---

### Week 2: 사업장 관리

#### Week 2-1: 사업장 Service & Controller

**작업 13: Site Service**

**파일: `backend/src/services/site.service.ts`** (Lines 1-600)

```typescript
// Lines 1-30: Import
import { prisma } from '../config/database';
import { redis } from '../config/redis';
import { Division, SiteType } from '@prisma/client';

export class SiteService {
  // Lines 35-120: 사업장 목록 조회 (필터링, 페이지네이션, 캐싱)
  async getSites(filter: SiteFilter, pagination: Pagination) {
    const cacheKey = `sites:${JSON.stringify({ filter, pagination })}`;

    // Redis 캐시 확인
    const cached = await redis.get(cacheKey);
    if (cached) return JSON.parse(cached);

    // 필터 조건 구성
    const where: any = {
      isActive: true,
      deletedAt: null,
    };

    if (filter.type) where.type = filter.type;
    if (filter.division) where.division = filter.division;
    if (filter.groupId) where.groupId = filter.groupId;
    if (filter.search) {
      where.OR = [
        { name: { contains: filter.search } },
        { address: { contains: filter.search } },
      ];
    }

    // 데이터 조회
    const [sites, total] = await Promise.all([
      prisma.site.findMany({
        where,
        skip: (pagination.page - 1) * pagination.limit,
        take: pagination.limit,
        include: {
          group: true,
          staffSites: {
            include: { staff: { include: { user: true } } },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.site.count({ where }),
    ]);

    const result = { sites, total };

    // 캐시 저장 (10분)
    await redis.setex(cacheKey, 600, JSON.stringify(result));

    return result;
  }

  // Lines 125-200: 사업장 생성
  async createSite(data: CreateSiteDto, userId: string) {
    // 권한 검증 (부문 확인)
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (user.role === 'HQ_ADMIN' && data.division !== 'HQ') {
      throw new Error('본사 관리자는 본사 사업장만 생성 가능');
    }

    if (user.role === 'YEONGNAM_ADMIN' && data.division !== 'YEONGNAM') {
      throw new Error('영남지사 관리자는 영남지사 사업장만 생성 가능');
    }

    // 사업장 생성
    const site = await prisma.site.create({
      data: {
        ...data,
        staffSites: {
          create: data.staffIds?.map((staffId) => ({
            staffId,
            isPrimary: data.staffIds[0] === staffId,
          })),
        },
      },
      include: {
        group: true,
        staffSites: { include: { staff: true } },
      },
    });

    // 캐시 무효화
    await this.invalidateCache();

    return site;
  }

  // Lines 205-270: 사업장 수정
  async updateSite(id: string, data: UpdateSiteDto, userId: string) {
    // 권한 검증
    await this.checkPermission(id, userId);

    const site = await prisma.site.update({
      where: { id },
      data: {
        ...data,
        staffSites: data.staffIds
          ? {
              deleteMany: {},
              create: data.staffIds.map((staffId) => ({
                staffId,
                isPrimary: data.staffIds[0] === staffId,
              })),
            }
          : undefined,
      },
      include: {
        group: true,
        staffSites: { include: { staff: true } },
      },
    });

    await this.invalidateCache();
    return site;
  }

  // Lines 275-310: 사업장 삭제 (Soft Delete)
  async deleteSite(id: string, userId: string) {
    await this.checkPermission(id, userId);

    await prisma.site.update({
      where: { id },
      data: {
        isActive: false,
        deletedAt: new Date(),
      },
    });

    await this.invalidateCache();
  }

  // Lines 315-350: 사업장 상세 조회
  async getSiteById(id: string, userId: string) {
    const site = await prisma.site.findUnique({
      where: { id, isActive: true },
      include: {
        group: true,
        staffSites: {
          include: {
            staff: {
              include: { user: true },
            },
          },
        },
        menus: { take: 10, orderBy: { startDate: 'desc' } },
        mealPhotos: { take: 10, orderBy: { capturedAt: 'desc' } },
        feedbacks: { take: 5, orderBy: { createdAt: 'desc' } },
      },
    });

    if (!site) throw new Error('사업장을 찾을 수 없습니다');

    // 권한 검증
    await this.checkViewPermission(site, userId);

    return site;
  }

  // Lines 355-400: 권한 검증 헬퍼
  private async checkPermission(siteId: string, userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    const site = await prisma.site.findUnique({ where: { id: siteId } });

    if (!site) throw new Error('사업장을 찾을 수 없습니다');

    if (user.role === 'SUPER_ADMIN') return;

    if (user.role === 'HQ_ADMIN' && site.division !== 'HQ') {
      throw new Error('권한이 없습니다');
    }

    if (user.role === 'YEONGNAM_ADMIN' && site.division !== 'YEONGNAM') {
      throw new Error('권한이 없습니다');
    }
  }

  private async checkViewPermission(site: any, userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (user.role === 'SUPER_ADMIN') return;

    if (user.role === 'HQ_ADMIN' && site.division !== 'HQ') {
      throw new Error('권한이 없습니다');
    }

    if (user.role === 'YEONGNAM_ADMIN' && site.division !== 'YEONGNAM') {
      throw new Error('권한이 없습니다');
    }

    if (user.role === 'STAFF') {
      const assigned = site.staffSites.some(ss => ss.staff.userId === userId);
      if (!assigned) throw new Error('담당 사업장이 아닙니다');
    }
  }

  // Lines 405-420: 캐시 무효화
  private async invalidateCache() {
    const keys = await redis.keys('sites:*');
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  }
}
```

**예상 라인: 600라인**

---

**작업 14: Site Controller**

**파일: `backend/src/controllers/site.controller.ts`** (Lines 1-400)

```typescript
// Lines 1-20: Import
import { Request, Response } from 'express';
import { SiteService } from '../services/site.service';
import { successResponse, errorResponse, createPaginationMeta } from '../utils/api-response.util';

export class SiteController {
  private siteService: SiteService;

  constructor() {
    this.siteService = new SiteService();
  }

  // Lines 25-80: GET /api/v1/sites
  async getSites(req: Request, res: Response) {
    try {
      const filter = {
        type: req.query.type as any,
        division: req.query.division as any,
        groupId: req.query.groupId as string,
        search: req.query.search as string,
      };

      const pagination = {
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 20,
      };

      const { sites, total } = await this.siteService.getSites(filter, pagination);

      const meta = createPaginationMeta(pagination.page, pagination.limit, total);

      res.json(successResponse({ sites }, undefined, meta));
    } catch (error) {
      res.status(500).json(errorResponse(error.message));
    }
  }

  // Lines 85-130: GET /api/v1/sites/:id
  async getSiteById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user.userId;

      const site = await this.siteService.getSiteById(id, userId);

      res.json(successResponse(site));
    } catch (error) {
      res.status(404).json(errorResponse(error.message));
    }
  }

  // Lines 135-180: POST /api/v1/sites
  async createSite(req: Request, res: Response) {
    try {
      const userId = req.user.userId;
      const site = await this.siteService.createSite(req.body, userId);

      res.status(201).json(successResponse(site, '사업장이 생성되었습니다'));
    } catch (error) {
      res.status(400).json(errorResponse(error.message));
    }
  }

  // Lines 185-230: PUT /api/v1/sites/:id
  async updateSite(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user.userId;

      const site = await this.siteService.updateSite(id, req.body, userId);

      res.json(successResponse(site, '사업장이 수정되었습니다'));
    } catch (error) {
      res.status(400).json(errorResponse(error.message));
    }
  }

  // Lines 235-270: DELETE /api/v1/sites/:id
  async deleteSite(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user.userId;

      await this.siteService.deleteSite(id, userId);

      res.json(successResponse(null, '사업장이 삭제되었습니다'));
    } catch (error) {
      res.status(400).json(errorResponse(error.message));
    }
  }
}
```

**예상 라인: 400라인**

---

**작업 15: Site Routes**

**파일: `backend/src/routes/site.routes.ts`** (Lines 1-100)

```typescript
import { Router } from 'express';
import { SiteController } from '../controllers/site.controller';
import { authMiddleware, roleMiddleware } from '../middlewares/auth.middleware';
import { validateRequest } from '../middlewares/validator.middleware';
import { createSiteSchema, updateSiteSchema } from '../validators/site.validator';

const router = Router();
const controller = new SiteController();

// GET /api/v1/sites - 모든 권한
router.get('/', authMiddleware, controller.getSites.bind(controller));

// GET /api/v1/sites/:id - 모든 권한
router.get('/:id', authMiddleware, controller.getSiteById.bind(controller));

// POST /api/v1/sites - ADMIN만
router.post(
  '/',
  authMiddleware,
  roleMiddleware(['SUPER_ADMIN', 'HQ_ADMIN', 'YEONGNAM_ADMIN']),
  validateRequest(createSiteSchema),
  controller.createSite.bind(controller)
);

// PUT /api/v1/sites/:id - ADMIN만
router.put(
  '/:id',
  authMiddleware,
  roleMiddleware(['SUPER_ADMIN', 'HQ_ADMIN', 'YEONGNAM_ADMIN']),
  validateRequest(updateSiteSchema),
  controller.updateSite.bind(controller)
);

// DELETE /api/v1/sites/:id - ADMIN만
router.delete(
  '/:id',
  authMiddleware,
  roleMiddleware(['SUPER_ADMIN', 'HQ_ADMIN', 'YEONGNAM_ADMIN']),
  controller.deleteSite.bind(controller)
);

export default router;
```

**예상 라인: 100라인**

---

#### Week 2-2: 사업장 그룹 관리

**작업 16: SiteGroup Service**

**파일: `backend/src/services/site-group.service.ts`** (Lines 1-500)

```typescript
import { prisma } from '../config/database';
import { redis } from '../config/redis';
import { Division } from '@prisma/client';

export class SiteGroupService {
  // Lines 10-80: 그룹 목록 조회
  async getGroups(division?: Division) {
    const cacheKey = `site-groups:${division || 'all'}`;

    const cached = await redis.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const where: any = { isActive: true };
    if (division) where.division = division;

    const groups = await prisma.siteGroup.findMany({
      where,
      include: {
        sites: {
          where: { isActive: true },
          select: { id: true, name: true, type: true },
        },
        _count: { select: { sites: true } },
      },
      orderBy: { sortOrder: 'asc' },
    });

    await redis.setex(cacheKey, 600, JSON.stringify(groups));
    return groups;
  }

  // Lines 85-140: 그룹 생성
  async createGroup(data: CreateGroupDto) {
    const group = await prisma.siteGroup.create({
      data,
      include: {
        sites: true,
        _count: { select: { sites: true } },
      },
    });

    await this.invalidateCache();
    return group;
  }

  // Lines 145-200: 그룹 수정
  async updateGroup(id: string, data: UpdateGroupDto) {
    const group = await prisma.siteGroup.update({
      where: { id },
      data,
      include: {
        sites: true,
        _count: { select: { sites: true } },
      },
    });

    await this.invalidateCache();
    return group;
  }

  // Lines 205-250: 그룹에 사업장 추가
  async addSitesToGroup(groupId: string, siteIds: string[]) {
    const group = await prisma.siteGroup.findUnique({
      where: { id: groupId },
    });

    if (!group) throw new Error('그룹을 찾을 수 없습니다');

    // 같은 부문의 사업장만 추가 가능
    const sites = await prisma.site.findMany({
      where: { id: { in: siteIds } },
    });

    const invalidSites = sites.filter(s => s.division !== group.division);
    if (invalidSites.length > 0) {
      throw new Error('같은 부문의 사업장만 추가할 수 있습니다');
    }

    await prisma.site.updateMany({
      where: { id: { in: siteIds } },
      data: { groupId },
    });

    await this.invalidateCache();
  }

  // Lines 255-290: 그룹에서 사업장 제거
  async removeSitesFromGroup(groupId: string, siteIds: string[]) {
    await prisma.site.updateMany({
      where: {
        id: { in: siteIds },
        groupId,
      },
      data: { groupId: null },
    });

    await this.invalidateCache();
  }

  // Lines 295-320: 캐시 무효화
  private async invalidateCache() {
    const keys = await redis.keys('site-groups:*');
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  }
}
```

**예상 라인: 500라인**

---

### ✅ Week 2 완료 시점 체크리스트

- [ ] 사업장 CRUD API 완성
- [ ] 사업장 그룹 CRUD API 완성
- [ ] 부문별 필터링 작동
- [ ] 권한 기반 접근 제어 작동
- [ ] Redis 캐싱 적용 확인
- [ ] 페이지네이션 작동 확인

**총 파일 수: +6개 (누적 18개)**
**총 예상 라인 수: +1,900라인 (누적 ~3,900라인)**

---

## 5. 중복 방지 체크리스트

### Agent 작업 전 필수 체크

**✅ 작업 시작 전:**
1. [ ] 파일 맵에서 담당 파일 확인
2. [ ] 예상 라인 수 확인 (2000라인 초과 예상 시 분리 계획)
3. [ ] 공통 모듈 사용 가능 여부 확인
4. [ ] 기존 코드에 동일 로직 있는지 검색

**✅ 코딩 중:**
1. [ ] 파일별 역할 범위 준수
2. [ ] 공통 로직은 utils로 분리
3. [ ] 중복 코드 발견 시 즉시 공통 모듈로 이동
4. [ ] 라인 수 1500 넘으면 경고, 2000 넘으면 즉시 분리

**✅ 작업 완료 후:**
1. [ ] 파일 라인 수 확인
2. [ ] 중복 코드 검사
3. [ ] 타입 정의 중복 확인
4. [ ] 다음 Agent를 위한 작업 로그 작성

---

## 6. Agent 인계 템플릿

**다음 Agent가 작업 시작 시 아래 정보 제공:**

```
[작업 완료 보고]

완료한 작업:
- Week X-X: 작업명
- 생성한 파일: [파일 경로] (총 XXX라인)
- 수정한 파일: [파일 경로] (Lines XX-XX 수정, 총 XXX라인)

다음 Agent 작업 사항:
- Week X-X: 작업명
- 작업할 파일: [파일 경로] (예상 XXX라인)
- 참고할 공통 모듈: [모듈명]

⚠️ 주의사항:
- [특정 파일]이 1800라인에 근접, 추가 작업 시 분리 필요
- [특정 로직]은 [utils 파일]에 이미 구현됨, 재사용할 것
```

---

**문서 버전**: 1.0
**최종 수정일**: 2025-01-09
**작성자**: Claude (Anthropic)

---

## 다음 페이지: Phase 1 Week 2 상세 가이드

(다음 문서에서 계속...)
