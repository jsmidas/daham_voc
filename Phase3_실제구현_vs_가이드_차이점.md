# Phase 3 실제 구현 vs 가이드 차이점 분석

> **분석 날짜**: 2025-10-12
> **분석 범위**: VOC 시스템, 근태 관리, 대시보드
> **목적**: Phase 3 가이드를 실제 구현 기준으로 업데이트하기 위한 상세 비교

---

## 📊 종합 요약

| 구분 | 가이드 상태 | 실제 구현 상태 | 완성도 |
|------|-----------|--------------|--------|
| **VOC 시스템** | ⏳ 예정 | ✅ **완료** | **90%** |
| **근태 관리** | ⏳ 예정 | ✅ **완료** | **85%** |
| **대시보드/통계** | ⏳ 예정 | 🟡 **기본만 완료** | **40%** |
| **알림 시스템** | ⏳ 예정 | ❌ 미구현 (로그만) | **10%** |

**핵심 메시지**: Phase 3의 VOC와 근태 관리는 대부분 구현되었으나, 가이드와 다른 설계로 구현됨. 대시보드는 기본 통계만, 알림은 미구현.

---

## 🔍 상세 비교 분석

## 1. VOC (CustomerFeedback) 시스템

### 1.1 데이터 모델 차이

| 필드명 | 가이드 | 실제 구현 | 영향도 | 비고 |
|-------|-------|----------|--------|------|
| **작성자** | `createdBy` | `authorId` | 🟡 중간 | 필드명만 다름, 기능 동일 |
| **작성자 타입** | `feedbackType: FeedbackType` | `authorType: FeedbackAuthorType` | 🟡 중간 | 필드명 및 Enum명 변경 |
| **Enum 값** | `STAFF`, `CUSTOMER` | `STAFF`, `CLIENT` | 🔴 높음 | `CUSTOMER` → `CLIENT` |
| **답변자** | `respondedBy`, `respondedAt` | `repliedBy`, `repliedAt` | 🟡 중간 | 필드명만 다름 |
| **답변 내용** | `response` | `adminReply` | 🟡 중간 | 필드명만 다름 |
| **상태 Enum** | `PENDING`, `IN_PROGRESS`, `RESOLVED` | `PENDING`, `IN_PROGRESS`, `RESOLVED`, **`CLOSED`** | 🟡 중간 | `CLOSED` 상태 추가됨 |
| **이미지** | ❌ 없음 | ✅ **`FeedbackImage` 모델** (최대 6개) | 🔴 높음 | **가이드에 없던 기능 추가** |
| **완료일시** | `resolvedAt` | ❌ 없음 | 🟢 낮음 | 실제로는 `repliedAt` 사용 |

### 1.2 Enum 정의 차이

#### Phase 3 가이드:
```prisma
enum FeedbackType {
  STAFF      // 담당자가 작성한 VOC
  CUSTOMER   // 고객사가 작성한 VOC
}

enum FeedbackStatus {
  PENDING       // 미처리
  IN_PROGRESS   // 처리 중
  RESOLVED      // 완료
}
```

#### 실제 구현:
```prisma
enum FeedbackAuthorType {
  STAFF  // 담당자
  CLIENT // 고객사 (⚠️ CUSTOMER → CLIENT)
}

enum FeedbackStatus {
  PENDING     // 미처리
  IN_PROGRESS // 처리중
  RESOLVED    // 처리완료
  CLOSED      // 종료 (⚠️ 추가됨)
}
```

### 1.3 이미지 첨부 기능 (가이드에 없음)

**실제 구현에 추가된 기능:**
```prisma
model FeedbackImage {
  id           String   @id @default(uuid())
  feedbackId   String
  imageUrl     String   // GCP Storage URL
  thumbnailUrl String?
  sortOrder    Int      @default(0) // 0-5 (최대 6개)

  feedback CustomerFeedback @relation(...)
}
```

**서비스 DTO:**
```typescript
export interface CreateFeedbackDto {
  siteId: string;
  authorType: FeedbackAuthorType;
  content: string;
  rating?: number;
  imageFiles?: Express.Multer.File[];  // ✅ 최대 6개
}
```

**영향도**: 🔴 **높음** - 가이드에 전혀 언급되지 않은 중요 기능

### 1.4 User 모델 Relations 차이

**가이드:**
```prisma
model User {
  createdFeedbacks  CustomerFeedback[] @relation("FeedbackCreator")
  respondedFeedbacks CustomerFeedback[] @relation("FeedbackResponder")
  averageRating Float? // 담당자 평균 별점
}
```

**실제 구현:**
```prisma
model User {
  feedbacks   CustomerFeedback[] // ✅ 단순 relation
  // averageRating은 Staff 모델에 있음 ⚠️
}

model Staff {
  averageRating Float @default(0) // ✅ 여기에 있음
}
```

**영향도**: 🟡 **중간** - averageRating 위치 변경

### 1.5 Service Layer 차이

| 기능 | 가이드 | 실제 구현 | 영향도 |
|------|-------|----------|--------|
| **기본 CRUD** | ✅ | ✅ | - |
| **이미지 업로드** | ❌ | ✅ **구현됨** | 🔴 높음 |
| **별점 시스템** | ✅ | ✅ | - |
| **관리자 답변** | `respondToFeedback()` | `replyToFeedback()` | 🟡 중간 |
| **상태 변경** | ✅ | ✅ (별도 함수) | - |
| **담당자 평균 별점 자동 계산** | ✅ `updateStaffAverageRating()` | ❌ **미구현** | 🔴 높음 |
| **미처리 VOC 조회** | ✅ `getPendingFeedbacks()` | ❌ **미구현** | 🟡 중간 |
| **미처리 VOC 알림** | ✅ `notifyPendingFeedbacks()` | ❌ **미구현** | 🟡 중간 |
| **담당자 별점 조회** | ✅ `getStaffRatings()` | ❌ **미구현** | 🟡 중간 |

---

## 2. Attendance (근태 관리) 시스템

### 2.1 데이터 모델 차이

| 필드명 | 가이드 | 실제 구현 | 영향도 | 비고 |
|-------|-------|----------|--------|------|
| **날짜** | `date: DateTime` (별도 필드) | ❌ 없음 (checkInTime 사용) | 🟡 중간 | 날짜는 checkInTime에서 추출 |
| **예상 출근 시간** | `expectedCheckIn: DateTime` | ❌ 없음 (AttendanceSetting에 있음) | 🔴 높음 | 별도 모델로 분리 |
| **예상 퇴근 시간** | `expectedCheckOut: DateTime` | ❌ 없음 (AttendanceSetting에 있음) | 🔴 높음 | 별도 모델로 분리 |
| **지각 여부** | `isLate: Boolean` | ❌ 없음 | 🔴 높음 | `status` Enum으로 대체 |
| **조퇴 여부** | `isEarlyLeave: Boolean` | ❌ 없음 | 🔴 높음 | `status` Enum으로 대체 |
| **GPS 검증 (체크인)** | `checkInValid: Boolean` | ❌ 없음 | 🔴 높음 | `status`에 `OUTSIDE_RANGE`로 반영 |
| **GPS 검증 (체크아웃)** | `checkOutValid: Boolean` | ❌ 없음 | 🔴 높음 | `status`에 `OUTSIDE_RANGE`로 반영 |
| **상태** | ❌ 없음 | ✅ **`status: AttendanceStatus`** | 🔴 높음 | **새로운 설계** |
| **비고** | ❌ 없음 | ✅ **`note: String?`** | 🟢 낮음 | 추가 기능 |

### 2.2 Prisma Schema 비교

#### Phase 3 가이드:
```prisma
model Attendance {
  id          String   @id
  userId      String
  siteId      String
  date        DateTime // ⚠️ 별도 날짜 필드

  checkInTime  DateTime?
  checkInLat   Float?
  checkInLng   Float?
  checkInValid Boolean? // ⚠️ GPS 검증 결과

  checkOutTime  DateTime?
  checkOutLat   Float?
  checkOutLng   Float?
  checkOutValid Boolean? // ⚠️ GPS 검증 결과

  expectedCheckIn  DateTime // ⚠️ Attendance에 있음
  expectedCheckOut DateTime

  isLate       Boolean @default(false) // ⚠️ Boolean 필드
  isEarlyLeave Boolean @default(false)
}

// Site 모델에 근무 시간 설정
model Site {
  workStartTime String? // ⚠️ Site에 있음
  workEndTime   String?
}
```

#### 실제 구현:
```prisma
model Attendance {
  id       String @id
  userId   String
  siteId   String
  // date 필드 없음! checkInTime으로 날짜 판단

  checkInTime  DateTime
  checkInLat   Float?
  checkInLng   Float?
  // checkInValid 없음! status로 판단

  checkOutTime DateTime?
  checkOutLat  Float?
  checkOutLng  Float?
  // checkOutValid 없음! status로 판단

  status AttendanceStatus @default(NORMAL) // ✅ 상태로 통합
  note   String? // ✅ 추가됨
}

enum AttendanceStatus {
  NORMAL        // 정상
  LATE          // 지각 (⚠️ isLate → LATE)
  EARLY_LEAVE   // 조퇴 (⚠️ isEarlyLeave → EARLY_LEAVE)
  OUTSIDE_RANGE // 사업장 외부 체크인 (⚠️ checkInValid=false → OUTSIDE_RANGE)
}

// ✅ 별도 모델로 분리됨
model AttendanceSetting {
  id               String @id
  siteId           String
  expectedCheckIn  String  // HH:mm 형식 (⚠️ DateTime → String)
  expectedCheckOut String
  allowedRadius    Int @default(100)
  isActive         Boolean @default(true)
}
```

**영향도**: 🔴 **높음** - 설계 방식이 완전히 다름

### 2.3 Service Layer 차이

| 기능 | 가이드 | 실제 구현 | 영향도 |
|------|-------|----------|--------|
| **체크인** | `checkIn(dto, userId)` | ✅ 동일 | - |
| **체크아웃** | `checkOut(dto, userId)` | ✅ 동일 | - |
| **근태 목록 조회** | ✅ | ✅ | - |
| **오늘의 근태 조회** | ❌ | ✅ **`getTodayAttendance()`** | 🟢 낮음 |
| **출퇴근 설정 관리** | ❌ | ✅ **`upsertAttendanceSetting()`** | 🔴 높음 |
| **개인 근태 통계** | ✅ `getAttendanceStatistics(userId, ...)` | ✅ | - |
| **사업장별 근태 통계** | ✅ `getSiteAttendanceStatistics(...)` | ✅ | - |
| **사용자별 근태 조회** | ❌ | ✅ **`getUserAttendances()`** | 🟢 낮음 |
| **비정상 출근 조회** | ✅ `getAbnormalAttendances()` | ❌ **미구현** | 🟡 중간 |
| **담당자별 통계 집계** | ✅ (가이드에 자세함) | ❌ **미구현** | 🟡 중간 |
| **근태 수정 (관리자)** | ✅ `updateAttendance()` | ❌ **미구현** | 🟡 중간 |

### 2.4 GPS 검증 로직 차이

**가이드:**
- `checkInValid`, `checkOutValid` Boolean 필드에 저장
- `isValidLocation` 필드로 검증 결과 저장

**실제 구현:**
- GPS 범위 밖이면 `status = OUTSIDE_RANGE`
- Boolean 필드는 없고, 상태로 통합 관리

**영향도**: 🔴 **높음** - 데이터 조회 방식이 다름

---

## 3. Dashboard (대시보드) 시스템

### 3.1 구현 범위 비교

| 기능 | 가이드 | 실제 구현 | 영향도 |
|------|-------|----------|--------|
| **대시보드 요약 통계** | ✅ `getDashboardSummary()` | ✅ **기본만 구현** | 🟡 중간 |
| **사업장별 상세 통계** | ✅ `getSiteDetailStats()` | ❌ **미구현** | 🔴 높음 |
| **담당자별 성과 통계** | ✅ `getStaffPerformance()` | ❌ **미구현** | 🔴 높음 |
| **부문별 비교 통계** | ✅ `getDivisionComparison()` | ❌ **미구현** | 🔴 높음 |
| **일별 트렌드 데이터** | ✅ `getDailyTrends()` | ❌ **미구현** | 🔴 높음 |

### 3.2 DashboardSummary 차이

**가이드:**
```typescript
export interface DashboardSummary {
  sites: SiteSummary;        // 사업장 타입별, 부문별 통계
  feedbacks: FeedbackSummary; // VOC 상태별, 평균 별점
  attendances: AttendanceSummary; // 근태 통계, 지각률
  staff: StaffSummary;       // 담당자 통계
}
```

**실제 구현:**
```typescript
export interface DashboardSummary {
  totalSites: number;
  totalFeedbacks: number;
  pendingFeedbacks: number;
  resolvedFeedbacks: number;
  avgRating: number;
  totalAttendances: number;
  normalAttendances: number;
  lateAttendances: number;
  // ⚠️ 단순한 숫자만 반환 (상세 분석 없음)
}
```

**영향도**: 🔴 **높음** - 가이드보다 훨씬 단순함

---

## 4. Notification (알림) 시스템

### 4.1 구현 상태

**가이드:**
```typescript
// utils/notification.util.ts
export async function sendNotification(data: NotificationData): Promise<void> {
  // FCM 푸시 알림 발송 (Phase 5에서 구현 예정)
}
```

**실제 구현:**
```typescript
// ❌ utils/notification.util.ts 파일 없음
// 알림 기능 미구현
```

**영향도**: 🟡 **중간** - 가이드에서도 Phase 5 예정으로 명시

---

## 5. 파일 구조 비교

### 5.1 Backend 파일 (실제 생성된 파일)

| 가이드 경로 | 실제 경로 | 상태 | 비고 |
|------------|----------|------|------|
| `services/customer-feedback.service.ts` | `services/feedback.service.ts` | ✅ 존재 | 파일명 간소화 |
| `controllers/customer-feedback.controller.ts` | `controllers/feedback.controller.ts` | ✅ 존재 | 파일명 간소화 |
| `routes/customer-feedback.routes.ts` | `routes/feedback.routes.ts` | ✅ 존재 | 파일명 간소화 |
| `validators/customer-feedback.validator.ts` | `validators/feedback.validator.ts` | ✅ 존재 | 파일명 간소화 |
| `services/attendance.service.ts` | ✅ 동일 | ✅ 존재 | - |
| `controllers/attendance.controller.ts` | ✅ 동일 | ✅ 존재 | - |
| `routes/attendance.routes.ts` | ✅ 동일 | ✅ 존재 | - |
| `validators/attendance.validator.ts` | ✅ 동일 | ✅ 존재 | - |
| `services/dashboard.service.ts` | ✅ 동일 | ✅ 존재 | **단순화됨** |
| `controllers/dashboard.controller.ts` | ✅ 동일 | ✅ 존재 | **단순화됨** |
| `routes/dashboard.routes.ts` | ✅ 동일 | ✅ 존재 | **단순화됨** |
| `utils/notification.util.ts` | ❌ **없음** | ❌ 미생성 | Phase 5 예정 |
| `utils/statistics.util.ts` | ❌ **없음** | ❌ 미생성 | Dashboard에서 직접 처리 |
| `types/customer-feedback.types.ts` | ❌ **없음** | ❌ 미생성 | Service에 inline 정의 |
| `types/attendance.types.ts` | ❌ **없음** | ❌ 미생성 | Service에 inline 정의 |
| `types/dashboard.types.ts` | ❌ **없음** | ❌ 미생성 | Service에 inline 정의 |

**총 파일 수:**
- 가이드: 17개 파일 (신규 생성 예상)
- 실제: **11개 파일** (feedback 4 + attendance 4 + dashboard 3)

---

## 6. 주요 설계 결정 차이

### 6.1 CustomerFeedback - 이미지 첨부

**가이드**: 이미지 첨부 기능 없음
**실제**: ✅ FeedbackImage 모델로 최대 6개 이미지 지원

**설계 이유 (추정)**:
- VOC 증빙 자료 첨부 필요
- 시설/배식 관련 문제 시각적 제보

**영향**:
- Storage.service 재사용 (Phase 2)
- Multipart/form-data 처리 필요
- 이미지 압축/썸네일 생성

### 6.2 Attendance - Status Enum vs Boolean 필드

**가이드**: `isLate`, `isEarlyLeave`, `checkInValid`, `checkOutValid` Boolean 필드
**실제**: ✅ `status: AttendanceStatus` Enum

**설계 이유 (추정)**:
- 하나의 상태만 가질 수 있음 (LATE이면서 OUTSIDE_RANGE 아님)
- 쿼리 최적화 (단일 필드 검색)
- 확장성 (새로운 상태 추가 용이)

**영향**:
- 상태 조회 로직 단순화
- 여러 상태 동시 필터링 불가

### 6.3 AttendanceSetting 분리

**가이드**: Site 모델에 `workStartTime`, `workEndTime` 포함
**실제**: ✅ `AttendanceSetting` 별도 모델

**설계 이유 (추정)**:
- 사업장별 다양한 출퇴근 시간 설정
- GPS 허용 반경 설정 필요
- 이력 관리 필요 (isActive)

**영향**:
- 설정 변경 이력 추적 가능
- 복잡도 증가 (JOIN 필요)

### 6.4 파일명 간소화

**가이드**: `customer-feedback.*`
**실제**: `feedback.*`

**설계 이유 (추정)**:
- 파일명 간결성
- CustomerFeedback이 유일한 피드백 모델

---

## 7. API 엔드포인트 비교

### 7.1 VOC API

| Method | 가이드 엔드포인트 | 실제 엔드포인트 | 상태 |
|--------|---------------|---------------|------|
| POST | `/api/feedbacks` | `/api/v1/feedbacks` | ✅ |
| GET | `/api/feedbacks` | `/api/v1/feedbacks` | ✅ |
| GET | `/api/feedbacks/:id` | `/api/v1/feedbacks/:id` | ✅ |
| PATCH | `/api/feedbacks/:id/respond` | `/api/v1/feedbacks/:id/reply` | 🟡 경로 변경 |
| PATCH | `/api/feedbacks/:id` (상태 변경) | `/api/v1/feedbacks/:id/status` | 🟡 경로 분리 |
| DELETE | `/api/feedbacks/:id` | `/api/v1/feedbacks/:id` | ✅ |
| GET | `/api/feedbacks/staff-ratings` | ❌ **미구현** | ❌ |
| GET | `/api/feedbacks/statistics` | `/api/v1/feedbacks/statistics` | ✅ |
| GET | `/api/feedbacks/pending` | ❌ **미구현** | ❌ |
| GET | ❌ 없음 | `/api/v1/feedbacks/recent` | ✅ **추가됨** |

### 7.2 Attendance API

| Method | 가이드 엔드포인트 | 실제 엔드포인트 | 상태 |
|--------|---------------|---------------|------|
| POST | `/api/attendances/check-in` | `/api/v1/attendances/check-in` | ✅ |
| POST | `/api/attendances/check-out` | `/api/v1/attendances/check-out` | ✅ |
| GET | `/api/attendances` | `/api/v1/attendances` | ✅ |
| GET | `/api/attendances/statistics` | `/api/v1/attendances/statistics` | ✅ |
| GET | `/api/attendances/site/:siteId/statistics` | ❌ **미구현** | ❌ |
| GET | `/api/attendances/abnormal` | ❌ **미구현** | ❌ |
| PATCH | `/api/attendances/:id` | ❌ **미구현** | ❌ |
| GET | ❌ 없음 | `/api/v1/attendances/:id` | ✅ **추가됨** |
| GET | ❌ 없음 | `/api/v1/attendances/today` | ✅ **추가됨** |
| GET | ❌ 없음 | `/api/v1/attendances/user/:userId` | ✅ **추가됨** |
| POST | ❌ 없음 | `/api/v1/attendance-settings` | ✅ **추가됨** |
| GET | ❌ 없음 | `/api/v1/attendance-settings/:siteId` | ✅ **추가됨** |

### 7.3 Dashboard API

| Method | 가이드 엔드포인트 | 실제 엔드포인트 | 상태 |
|--------|---------------|---------------|------|
| GET | `/api/dashboard/summary` | `/api/v1/dashboard/summary` | ✅ (간소화) |
| GET | `/api/dashboard/site/:siteId` | ❌ **미구현** | ❌ |
| GET | `/api/dashboard/staff/:userId` | ❌ **미구현** | ❌ |
| GET | `/api/dashboard/division-comparison` | ❌ **미구현** | ❌ |
| GET | `/api/dashboard/trends` | ❌ **미구현** | ❌ |

---

## 8. 가이드 업데이트 권장사항

### 8.1 즉시 반영 필요 (🔴 높음)

1. **CustomerFeedback 모델**
   - `feedbackType` → `authorType`, `FeedbackType` → `FeedbackAuthorType`
   - `CUSTOMER` → `CLIENT`
   - `createdBy` → `authorId`, `respondedBy` → `repliedBy`
   - FeedbackImage 모델 추가 (최대 6개 이미지)
   - `CLOSED` 상태 추가

2. **Attendance 모델**
   - `date` 필드 제거 (checkInTime 사용)
   - `isLate`, `isEarlyLeave`, `checkInValid`, `checkOutValid` 제거
   - `status: AttendanceStatus` Enum 추가
   - `note` 필드 추가
   - AttendanceSetting 별도 모델로 분리

3. **Staff 평균 별점**
   - User.averageRating → Staff.averageRating

### 8.2 기능 범위 조정 필요 (🟡 중간)

1. **Dashboard 통계**
   - 가이드의 상세한 통계는 미구현
   - 기본 요약 통계만 있음을 명시

2. **알림 시스템**
   - notification.util.ts는 미구현
   - Phase 5 예정임을 명확히 표기

3. **파일명 변경**
   - `customer-feedback.*` → `feedback.*`

### 8.3 추가 구현 내용 반영 (🟢 낮음)

1. **VOC 이미지 업로드**
   - Multipart/form-data 처리
   - 최대 6개 이미지
   - storage.service 재사용

2. **AttendanceSetting CRUD**
   - 사업장별 출퇴근 시간 설정
   - GPS 허용 반경 설정

3. **추가된 API 엔드포인트**
   - `GET /api/v1/feedbacks/recent`
   - `GET /api/v1/attendances/today`
   - `GET /api/v1/attendances/user/:userId`

---

## 9. 체크리스트 업데이트

### Week 5: VOC 시스템
- [x] Task 5.1: Prisma 스키마 확장 (CustomerFeedback + FeedbackImage)
- [x] Task 5.2: Feedback Service (이미지 업로드 포함)
- [x] Task 5.3: Feedback Controller
- [x] Task 5.4: Feedback Routes & Validator
- [ ] ~~Task 5.5: 담당자 평균 별점 자동 계산~~ (미구현)
- [ ] ~~Task 5.6: 미처리 VOC 알림~~ (미구현)

### Week 6: 근태 관리
- [x] Task 6.1: Prisma 스키마 확장 (Attendance + AttendanceSetting)
- [x] Task 6.2: Attendance Service
- [x] Task 6.3: Attendance Controller & Routes & Validator
- [x] Task 6.4: AttendanceSetting CRUD
- [ ] ~~Task 6.5: 비정상 출근 알림~~ (미구현)
- [ ] ~~Task 6.6: 근태 수정 (관리자)~~ (미구현)

### Week 7: 통계 및 대시보드
- [x] Task 7.1: Dashboard Service (기본 요약만)
- [x] Task 7.2: Dashboard Controller & Routes
- [ ] ~~Task 7.3: Notification Utility~~ (미구현)
- [ ] ~~Task 7.4: 사업장별 상세 통계~~ (미구현)
- [ ] ~~Task 7.5: 담당자별 성과 통계~~ (미구현)
- [ ] ~~Task 7.6: 부문별 비교 통계~~ (미구현)
- [ ] ~~Task 7.7: 일별 트렌드 데이터~~ (미구현)

---

## 10. 결론

### 10.1 완성도 평가

- **VOC 시스템**: ✅ **90%** - 핵심 기능 완료, 이미지 첨부 추가 구현
- **근태 관리**: ✅ **85%** - 체크인/체크아웃 완료, 설정 관리 추가
- **대시보드**: 🟡 **40%** - 기본 요약 통계만
- **알림**: ❌ **10%** - 미구현 (로그만)

### 10.2 설계 철학 차이

**가이드**: 상세한 통계, 알림, 자동화에 중점
**실제**: 핵심 CRUD, 기본 통계, 확장 가능한 구조에 중점

### 10.3 권장 조치

1. **즉시**: Phase 3 가이드 문서를 실제 구현 기준으로 전면 수정
2. **단기**: Dashboard 상세 통계 구현 여부 결정
3. **장기**: 알림 시스템은 Phase 5에서 FCM과 함께 구현

---

**다음 작업**: Phase 3 가이드 문서 업데이트 (`구현_가이드_Phase3.md`)
