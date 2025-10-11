# 구현 가이드 - Phase 3: VOC 및 근태 관리 (2-3주) ✅ 핵심 완료

> **✅ 상태**: 핵심 기능 완료 (실제 구현 기준으로 문서 업데이트됨)
> **⚠️ 필수 선행 작업**: Phase 1, Phase 2 완료 필수
> **📅 실제 소요**: 약 2주 (VOC 및 근태 핵심 기능)
> **📊 실제 작업량**: ~11개 파일 (feedback 4 + attendance 4 + dashboard 3)

---

## 📋 Phase 3 개요

### 주요 목표
1. ✅ **VOC (Voice of Customer) 시스템** 구축
   - **이미지 첨부 기능 추가됨** (최대 6개, FeedbackImage 모델)
   - 별점 평가 시스템 (1-5점)
   - 관리자 답변 기능
2. ✅ **GPS 기반 근태 관리** (출퇴근 체크인)
   - AttendanceSetting 별도 모델로 분리
   - Status Enum으로 상태 관리
3. 🟡 **통계 및 대시보드 API** (기본 요약만)
4. ✅ **Redis 캐싱** 적용
5. ❌ **알림 시스템** (로그만, 미구현)

### 기술 스택
- **GPS 검증**: Geofencing (Phase 1 재사용)
- **캐싱**: Redis (통계 데이터)
- **이미지 저장**: GCP Storage (Phase 2 재사용)
- **알림**: 기본 로직만 (FCM은 Phase 5)
- **통계**: 집계 쿼리 (기본 요약만)

### ⚠️ 가이드와 다른 주요 변경사항
1. **CustomerFeedback**: 이미지 첨부 기능 추가 (FeedbackImage 모델)
2. **Attendance**: Status Enum으로 통합 (Boolean 필드 제거)
3. **AttendanceSetting**: 별도 모델로 분리
4. **파일명**: customer-feedback → feedback로 간소화
5. **Dashboard**: 기본 요약 통계만 구현 (상세 통계 미구현)

---

## 🗂️ Phase 3 파일 맵

### 실제 생성된 파일 (Week 5-7)

```
backend/
├── src/
│   ├── services/
│   │   ├── feedback.service.ts  ✅ [실제 구현] VOC CRUD 및 통계
│   │   ├── attendance.service.ts ✅ [실제 구현] 근태 CRUD 및 통계
│   │   └── dashboard.service.ts  ✅ [기본만] 대시보드 요약 통계
│   │
│   ├── controllers/
│   │   ├── feedback.controller.ts ✅ [실제 구현] VOC API
│   │   ├── attendance.controller.ts ✅ [실제 구현] 근태 API
│   │   └── dashboard.controller.ts  ✅ [기본만] 대시보드 API
│   │
│   ├── routes/
│   │   ├── feedback.routes.ts ✅ [실제 구현] VOC 라우팅
│   │   ├── attendance.routes.ts ✅ [실제 구현] 근태 라우팅
│   │   └── dashboard.routes.ts  ✅ [기본만] 대시보드 라우팅
│   │
│   ├── validators/
│   │   ├── feedback.validator.ts ✅ [실제 구현] VOC 검증
│   │   └── attendance.validator.ts ✅ [실제 구현] 근태 검증
│   │
│   ├── utils/
│   │   ├── notification.util.ts  ❌ [미생성] 알림 로직 (Phase 5 예정)
│   │   └── statistics.util.ts    ❌ [미생성] Service에 inline 처리
│   │
│   └── types/
│       ├── feedback.types.ts  ❌ [미생성] Service에 inline 정의
│       ├── attendance.types.ts ❌ [미생성] Service에 inline 정의
│       └── dashboard.types.ts  ❌ [미생성] Service에 inline 정의
│
├── prisma/
│   └── schema.prisma  ✅ [실제 구현]
│       - CustomerFeedback, FeedbackImage 모델
│       - Attendance, AttendanceSetting 모델
```

### 파일명 변경 사항
- ❌ `customer-feedback.*` → ✅ `feedback.*` (간소화)

### 기존 파일 활용
- ✅ `utils/geofencing.util.ts` - GPS 검증 (Phase 1)
- ✅ `config/redis.ts` - Redis 연결 (Phase 1)
- ✅ `utils/api-response.util.ts` - API 응답 (Phase 1)
- ✅ `services/storage.service.ts` - 이미지 업로드 (Phase 2)

---

## 🚨 중복 방지 규칙 (Phase 3)

### ❌ 절대 금지 사항
1. **GPS 검증 로직**: `geofencing.util.ts` (Phase 1)만 사용
2. **통계 계산**: `statistics.util.ts`에서만 구현
3. **알림 발송**: `notification.util.ts`에서만 구현
4. **캐시 키 생성**: 각 Service에서 일관된 형식 사용

### ✅ 올바른 사용 예시
```typescript
// ❌ 잘못된 예시 - attendance.service.ts에 GPS 검증 직접 구현
const isValid = haversineDistance(lat1, lng1, lat2, lng2) <= 100; // ❌ 중복!

// ✅ 올바른 예시 - geofencing.util.ts 활용
import { checkGeofencing } from '../utils/geofencing.util';
const isValid = checkGeofencing(userLoc, siteLoc, 100); // ✅
```

---

## 📅 Week 5: VOC 시스템

### Task 5.1: Prisma 스키마 확장 (CustomerFeedback 모델)

**파일**: `prisma/schema.prisma`
**작업 위치**: 기존 파일에 추가
**예상 라인**: +80 라인

```prisma
// CustomerFeedback (VOC) 모델
model CustomerFeedback {
  id          String   @id @default(uuid())
  siteId      String   @map("site_id")

  // VOC 내용
  content     String   @db.Text
  rating      Int      // 1-5점
  feedbackType FeedbackType @map("feedback_type") // STAFF, CUSTOMER

  // 상태 관리
  status      FeedbackStatus @default(PENDING)

  // 작성자 정보
  createdBy   String   @map("created_by")
  createdAt   DateTime @default(now()) @map("created_at")

  // 관리자 답변
  response    String?  @db.Text
  respondedBy String?  @map("responded_by")
  respondedAt DateTime? @map("responded_at")

  // 처리 완료
  resolvedAt  DateTime? @map("resolved_at")
  deletedAt   DateTime? @map("deleted_at")

  // Relations
  site        Site     @relation(fields: [siteId], references: [id])
  creator     User     @relation("FeedbackCreator", fields: [createdBy], references: [id])
  responder   User?    @relation("FeedbackResponder", fields: [respondedBy], references: [id])

  @@index([siteId, status])
  @@index([createdBy])
  @@index([status])
  @@map("customer_feedbacks")
}

enum FeedbackType {
  STAFF      // 담당자가 작성한 VOC
  CUSTOMER   // 고객사가 작성한 VOC
}

enum FeedbackStatus {
  PENDING       // 미처리
  IN_PROGRESS   // 처리 중
  RESOLVED      // 완료
}

// User 모델에 relation 추가
model User {
  // 기존 필드들...

  createdFeedbacks  CustomerFeedback[] @relation("FeedbackCreator")
  respondedFeedbacks CustomerFeedback[] @relation("FeedbackResponder")

  // 담당자 평균 별점 (자동 계산)
  averageRating Float? @map("average_rating")
}

// Site 모델에 relation 추가
model Site {
  // 기존 필드들...

  feedbacks  CustomerFeedback[]
}
```

**마이그레이션**:
```bash
npx prisma migrate dev --name add_customer_feedback_model
npx prisma generate
```

---

### Task 5.2: CustomerFeedback Service

**파일**: `src/services/customer-feedback.service.ts` (신규 생성)
**예상 라인**: 700-900 라인

```typescript
import { PrismaClient, FeedbackType, FeedbackStatus } from '@prisma/client';
import { redis } from '../config/redis';
import { NotFoundError, ForbiddenError } from '../utils/errors.util';
import { sendNotification } from '../utils/notification.util';

const prisma = new PrismaClient();

// Lines 1-40: 타입 정의
export interface CreateFeedbackDto {
  siteId: string;
  content: string;
  rating: number; // 1-5
  feedbackType: FeedbackType;
}

export interface UpdateFeedbackDto {
  response?: string;
  status?: FeedbackStatus;
}

export interface FeedbackFilter {
  siteId?: string;
  createdBy?: string;
  feedbackType?: FeedbackType;
  status?: FeedbackStatus;
  ratingMin?: number;
  ratingMax?: number;
  dateFrom?: Date;
  dateTo?: Date;
}

// Lines 45-150: VOC 생성
/**
 * VOC 생성
 * @description 담당자 또는 고객사가 VOC를 작성합니다
 */
export async function createFeedback(
  dto: CreateFeedbackDto,
  userId: string
): Promise<any> {
  // 별점 검증
  if (dto.rating < 1 || dto.rating > 5) {
    throw new Error('Rating must be between 1 and 5');
  }

  // 사업장 조회
  const site = await prisma.site.findUnique({
    where: { id: dto.siteId },
    include: {
      staffSites: {
        include: {
          staff: {
            include: { user: true },
          },
        },
      },
    },
  });

  if (!site || !site.isActive || site.deletedAt) {
    throw new NotFoundError('Site not found or inactive');
  }

  // VOC 생성
  const feedback = await prisma.customerFeedback.create({
    data: {
      siteId: dto.siteId,
      content: dto.content,
      rating: dto.rating,
      feedbackType: dto.feedbackType,
      createdBy: userId,
      status: FeedbackStatus.PENDING,
    },
    include: {
      site: {
        select: { id: true, name: true, type: true },
      },
      creator: {
        select: { id: true, name: true, email: true, role: true },
      },
    },
  });

  // 캐시 무효화
  await invalidateFeedbackCache(dto.siteId);

  // 담당자 평균 별점 재계산 (비동기)
  if (dto.feedbackType === FeedbackType.CUSTOMER) {
    // 고객사 VOC인 경우, 해당 사업장 담당자들의 평균 별점 갱신
    for (const staffSite of site.staffSites) {
      updateStaffAverageRating(staffSite.staff.userId).catch(console.error);
    }
  }

  // 알림 발송
  await sendNotification({
    type: 'NEW_FEEDBACK',
    targetUserIds: site.staffSites.map(ss => ss.staff.userId),
    data: {
      feedbackId: feedback.id,
      siteId: dto.siteId,
      siteName: site.name,
      rating: dto.rating,
    },
  });

  return feedback;
}

// Lines 155-280: VOC 목록 조회
/**
 * VOC 목록 조회
 * @description 필터링 및 페이지네이션 지원
 */
export async function getFeedbacks(filter: FeedbackFilter): Promise<any[]> {
  // 캐시 키 생성
  const cacheKey = `feedbacks:${JSON.stringify(filter)}`;

  // Redis 캐시 확인
  const cached = await redis.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }

  // 필터 조건 구성
  const where: any = {
    deletedAt: null,
  };

  if (filter.siteId) {
    where.siteId = filter.siteId;
  }

  if (filter.createdBy) {
    where.createdBy = filter.createdBy;
  }

  if (filter.feedbackType) {
    where.feedbackType = filter.feedbackType;
  }

  if (filter.status) {
    where.status = filter.status;
  }

  if (filter.ratingMin !== undefined || filter.ratingMax !== undefined) {
    where.rating = {};
    if (filter.ratingMin !== undefined) where.rating.gte = filter.ratingMin;
    if (filter.ratingMax !== undefined) where.rating.lte = filter.ratingMax;
  }

  if (filter.dateFrom || filter.dateTo) {
    where.createdAt = {};
    if (filter.dateFrom) where.createdAt.gte = filter.dateFrom;
    if (filter.dateTo) where.createdAt.lte = filter.dateTo;
  }

  // 조회
  const feedbacks = await prisma.customerFeedback.findMany({
    where,
    include: {
      site: {
        select: { id: true, name: true, type: true },
      },
      creator: {
        select: { id: true, name: true, email: true, role: true },
      },
      responder: {
        select: { id: true, name: true },
      },
    },
    orderBy: [
      { status: 'asc' }, // PENDING 먼저
      { createdAt: 'desc' },
    ],
  });

  // 캐시 저장 (5분)
  await redis.setex(cacheKey, 300, JSON.stringify(feedbacks));

  return feedbacks;
}

// Lines 285-400: 관리자 답변
/**
 * VOC 답변 (관리자)
 * @description 관리자가 VOC에 답변하고 상태를 변경합니다
 */
export async function respondToFeedback(
  feedbackId: string,
  dto: UpdateFeedbackDto,
  userId: string,
  userRole: string
): Promise<any> {
  // 관리자 권한 체크
  if (userRole !== 'ADMIN') {
    throw new ForbiddenError('Only admin can respond to feedback');
  }

  // 기존 VOC 조회
  const feedback = await prisma.customerFeedback.findUnique({
    where: { id: feedbackId },
    include: {
      creator: true,
      site: true,
    },
  });

  if (!feedback || feedback.deletedAt) {
    throw new NotFoundError('Feedback not found');
  }

  // 업데이트 데이터 준비
  const updateData: any = {};

  if (dto.response !== undefined) {
    updateData.response = dto.response;
    updateData.respondedBy = userId;
    updateData.respondedAt = new Date();
  }

  if (dto.status !== undefined) {
    updateData.status = dto.status;

    // 완료 처리 시 resolvedAt 설정
    if (dto.status === FeedbackStatus.RESOLVED) {
      updateData.resolvedAt = new Date();
    }
  }

  // DB 업데이트
  const updated = await prisma.customerFeedback.update({
    where: { id: feedbackId },
    data: updateData,
    include: {
      site: true,
      creator: {
        select: { id: true, name: true, email: true },
      },
      responder: {
        select: { id: true, name: true },
      },
    },
  });

  // 캐시 무효화
  await invalidateFeedbackCache(feedback.siteId);

  // 알림 발송 (작성자에게)
  if (dto.response) {
    await sendNotification({
      type: 'FEEDBACK_RESPONSE',
      targetUserIds: [feedback.createdBy],
      data: {
        feedbackId: updated.id,
        siteName: feedback.site.name,
        response: dto.response,
      },
    });
  }

  return updated;
}

// Lines 405-500: VOC 삭제
/**
 * VOC 삭제 (Soft Delete)
 * @description 작성자 본인 또는 관리자만 삭제 가능
 */
export async function deleteFeedback(
  feedbackId: string,
  userId: string,
  userRole: string
): Promise<void> {
  const feedback = await prisma.customerFeedback.findUnique({
    where: { id: feedbackId },
  });

  if (!feedback || feedback.deletedAt) {
    throw new NotFoundError('Feedback not found');
  }

  // 권한 체크 (본인 또는 관리자)
  if (feedback.createdBy !== userId && userRole !== 'ADMIN') {
    throw new ForbiddenError('Only creator or admin can delete feedback');
  }

  // Soft Delete
  await prisma.customerFeedback.update({
    where: { id: feedbackId },
    data: { deletedAt: new Date() },
  });

  // 캐시 무효화
  await invalidateFeedbackCache(feedback.siteId);
}

// Lines 505-620: 담당자 평균 별점 계산
/**
 * 담당자 평균 별점 재계산
 * @description 해당 담당자가 관리하는 사업장의 고객 VOC 평균 계산
 */
async function updateStaffAverageRating(userId: string): Promise<void> {
  // 담당자가 관리하는 사업장 조회
  const staffSites = await prisma.staffSite.findMany({
    where: { userId },
    select: { siteId: true },
  });

  const siteIds = staffSites.map(ss => ss.siteId);

  if (siteIds.length === 0) {
    return;
  }

  // 해당 사업장들의 고객 VOC 평균 별점 계산
  const result = await prisma.customerFeedback.aggregate({
    where: {
      siteId: { in: siteIds },
      feedbackType: FeedbackType.CUSTOMER,
      deletedAt: null,
    },
    _avg: {
      rating: true,
    },
  });

  const averageRating = result._avg.rating || 0;

  // User 모델 업데이트
  await prisma.user.update({
    where: { id: userId },
    data: { averageRating },
  });
}

/**
 * 담당자별 평균 별점 조회
 */
export async function getStaffRatings(
  division?: string
): Promise<any[]> {
  const where: any = {
    role: 'STAFF',
    averageRating: { not: null },
  };

  const staffUsers = await prisma.user.findMany({
    where,
    select: {
      id: true,
      name: true,
      email: true,
      division: true,
      averageRating: true,
    },
    orderBy: {
      averageRating: 'desc',
    },
  });

  if (division) {
    return staffUsers.filter(u => u.division === division);
  }

  return staffUsers;
}

// Lines 625-750: VOC 통계
/**
 * VOC 통계 (상태별, 기간별)
 */
export async function getFeedbackStatistics(
  dateFrom: Date,
  dateTo: Date,
  siteId?: string
): Promise<any> {
  const cacheKey = `feedback-stats:${siteId || 'all'}:${dateFrom.toISOString()}:${dateTo.toISOString()}`;

  // Redis 캐시 확인
  const cached = await redis.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }

  const where: any = {
    createdAt: {
      gte: dateFrom,
      lte: dateTo,
    },
    deletedAt: null,
  };

  if (siteId) {
    where.siteId = siteId;
  }

  // 전체 통계
  const [total, byStatus, byType, avgRating] = await Promise.all([
    // 총 VOC 수
    prisma.customerFeedback.count({ where }),

    // 상태별
    prisma.customerFeedback.groupBy({
      by: ['status'],
      where,
      _count: true,
    }),

    // 타입별
    prisma.customerFeedback.groupBy({
      by: ['feedbackType'],
      where,
      _count: true,
    }),

    // 평균 별점
    prisma.customerFeedback.aggregate({
      where,
      _avg: { rating: true },
    }),
  ]);

  // 별점 분포
  const ratingDistribution = await prisma.customerFeedback.groupBy({
    by: ['rating'],
    where,
    _count: true,
  });

  const stats = {
    total,
    byStatus: byStatus.reduce((acc, item) => {
      acc[item.status] = item._count;
      return acc;
    }, {} as Record<string, number>),
    byType: byType.reduce((acc, item) => {
      acc[item.feedbackType] = item._count;
      return acc;
    }, {} as Record<string, number>),
    averageRating: avgRating._avg.rating || 0,
    ratingDistribution: ratingDistribution.reduce((acc, item) => {
      acc[item.rating] = item._count;
      return acc;
    }, {} as Record<number, number>),
  };

  // 캐시 저장 (10분)
  await redis.setex(cacheKey, 600, JSON.stringify(stats));

  return stats;
}

// Lines 755-850: 미처리 VOC 알림
/**
 * 미처리 VOC 목록 조회
 * @description 24시간 이상 미처리된 VOC를 조회합니다
 */
export async function getPendingFeedbacks(
  hoursThreshold: number = 24
): Promise<any[]> {
  const thresholdDate = new Date();
  thresholdDate.setHours(thresholdDate.getHours() - hoursThreshold);

  return getFeedbacks({
    status: FeedbackStatus.PENDING,
    dateTo: thresholdDate,
  });
}

/**
 * 미처리 VOC 알림 발송
 * @description 정기적으로 실행하여 미처리 VOC를 알립니다 (Cron)
 */
export async function notifyPendingFeedbacks(): Promise<void> {
  const pendingFeedbacks = await getPendingFeedbacks(24);

  if (pendingFeedbacks.length === 0) {
    return;
  }

  // 관리자들에게 알림
  const admins = await prisma.user.findMany({
    where: { role: 'ADMIN', isActive: true },
    select: { id: true },
  });

  const adminIds = admins.map(a => a.id);

  await sendNotification({
    type: 'PENDING_FEEDBACKS_ALERT',
    targetUserIds: adminIds,
    data: {
      count: pendingFeedbacks.length,
      feedbacks: pendingFeedbacks.map(f => ({
        id: f.id,
        siteName: f.site.name,
        rating: f.rating,
        createdAt: f.createdAt,
      })),
    },
  });
}

// Lines 855-900: 헬퍼 함수
async function invalidateFeedbackCache(siteId: string): Promise<void> {
  const keys = await redis.keys(`feedbacks:*${siteId}*`);
  const statKeys = await redis.keys(`feedback-stats:*`);

  const allKeys = [...keys, ...statKeys];

  if (allKeys.length > 0) {
    await redis.del(...allKeys);
  }
}
```

---

### Task 5.3: CustomerFeedback Controller

**파일**: `src/controllers/customer-feedback.controller.ts` (신규 생성)
**예상 라인**: 400-500 라인

```typescript
import { Request, Response } from 'express';
import * as feedbackService from '../services/customer-feedback.service';
import { successResponse, errorResponse } from '../utils/api-response.util';
import { FeedbackType, FeedbackStatus } from '@prisma/client';

// Lines 1-70: VOC 생성
/**
 * POST /api/feedbacks
 */
export async function createFeedback(req: Request, res: Response) {
  try {
    const { siteId, content, rating, feedbackType } = req.body;

    const feedback = await feedbackService.createFeedback(
      {
        siteId,
        content,
        rating: parseInt(rating),
        feedbackType: feedbackType as FeedbackType,
      },
      req.user!.userId
    );

    return res.status(201).json(successResponse(feedback, 'Feedback created successfully'));
  } catch (error) {
    return res.status(400).json(errorResponse(error.message));
  }
}

// Lines 75-170: VOC 목록 조회
/**
 * GET /api/feedbacks
 */
export async function getFeedbacks(req: Request, res: Response) {
  try {
    const {
      siteId,
      createdBy,
      feedbackType,
      status,
      ratingMin,
      ratingMax,
      dateFrom,
      dateTo,
    } = req.query;

    const filter: any = {};

    if (siteId) filter.siteId = siteId as string;
    if (createdBy) filter.createdBy = createdBy as string;
    if (feedbackType) filter.feedbackType = feedbackType as FeedbackType;
    if (status) filter.status = status as FeedbackStatus;
    if (ratingMin) filter.ratingMin = parseInt(ratingMin as string);
    if (ratingMax) filter.ratingMax = parseInt(ratingMax as string);
    if (dateFrom) filter.dateFrom = new Date(dateFrom as string);
    if (dateTo) filter.dateTo = new Date(dateTo as string);

    const feedbacks = await feedbackService.getFeedbacks(filter);

    return res.json(successResponse(feedbacks));
  } catch (error) {
    return res.status(400).json(errorResponse(error.message));
  }
}

// Lines 175-240: 단일 VOC 조회
/**
 * GET /api/feedbacks/:id
 */
export async function getFeedbackById(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const feedbacks = await feedbackService.getFeedbacks({});
    const feedback = feedbacks.find(f => f.id === id);

    if (!feedback) {
      return res.status(404).json(errorResponse('Feedback not found'));
    }

    return res.json(successResponse(feedback));
  } catch (error) {
    return res.status(400).json(errorResponse(error.message));
  }
}

// Lines 245-310: VOC 답변 (관리자)
/**
 * PATCH /api/feedbacks/:id/respond
 */
export async function respondToFeedback(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { response, status } = req.body;

    const feedback = await feedbackService.respondToFeedback(
      id,
      {
        response,
        status: status as FeedbackStatus,
      },
      req.user!.userId,
      req.user!.role
    );

    return res.json(successResponse(feedback, 'Response added successfully'));
  } catch (error) {
    return res.status(400).json(errorResponse(error.message));
  }
}

// Lines 315-360: VOC 삭제
/**
 * DELETE /api/feedbacks/:id
 */
export async function deleteFeedback(req: Request, res: Response) {
  try {
    const { id } = req.params;

    await feedbackService.deleteFeedback(id, req.user!.userId, req.user!.role);

    return res.json(successResponse(null, 'Feedback deleted successfully'));
  } catch (error) {
    return res.status(400).json(errorResponse(error.message));
  }
}

// Lines 365-420: 담당자 평균 별점
/**
 * GET /api/feedbacks/staff-ratings
 */
export async function getStaffRatings(req: Request, res: Response) {
  try {
    const { division } = req.query;

    const ratings = await feedbackService.getStaffRatings(division as string);

    return res.json(successResponse(ratings));
  } catch (error) {
    return res.status(400).json(errorResponse(error.message));
  }
}

// Lines 425-490: VOC 통계
/**
 * GET /api/feedbacks/statistics
 */
export async function getFeedbackStatistics(req: Request, res: Response) {
  try {
    const { dateFrom, dateTo, siteId } = req.query;

    const stats = await feedbackService.getFeedbackStatistics(
      new Date(dateFrom as string),
      new Date(dateTo as string),
      siteId as string
    );

    return res.json(successResponse(stats));
  } catch (error) {
    return res.status(400).json(errorResponse(error.message));
  }
}

// Lines 495-500: 미처리 VOC 조회
/**
 * GET /api/feedbacks/pending
 */
export async function getPendingFeedbacks(req: Request, res: Response) {
  try {
    const { hoursThreshold } = req.query;

    const pending = await feedbackService.getPendingFeedbacks(
      hoursThreshold ? parseInt(hoursThreshold as string) : 24
    );

    return res.json(successResponse(pending));
  } catch (error) {
    return res.status(400).json(errorResponse(error.message));
  }
}
```

---

### Task 5.4: CustomerFeedback Routes

**파일**: `src/routes/customer-feedback.routes.ts` (신규 생성)
**예상 라인**: 100-150 라인

```typescript
import { Router } from 'express';
import * as feedbackController from '../controllers/customer-feedback.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

// Lines 1-80: VOC 관리 라우트
router.post(
  '/',
  authenticate,
  authorize(['STAFF', 'CUSTOMER']),
  feedbackController.createFeedback
);

router.get(
  '/',
  authenticate,
  feedbackController.getFeedbacks
);

router.get(
  '/staff-ratings',
  authenticate,
  authorize(['ADMIN']),
  feedbackController.getStaffRatings
);

router.get(
  '/statistics',
  authenticate,
  authorize(['ADMIN']),
  feedbackController.getFeedbackStatistics
);

router.get(
  '/pending',
  authenticate,
  authorize(['ADMIN']),
  feedbackController.getPendingFeedbacks
);

router.get(
  '/:id',
  authenticate,
  feedbackController.getFeedbackById
);

router.patch(
  '/:id/respond',
  authenticate,
  authorize(['ADMIN']),
  feedbackController.respondToFeedback
);

router.delete(
  '/:id',
  authenticate,
  feedbackController.deleteFeedback
);

export default router;
```

**파일**: `src/app.ts` (기존 파일 수정)

```typescript
// 라우트 등록
import feedbackRoutes from './routes/customer-feedback.routes';

app.use('/api/feedbacks', feedbackRoutes);
```

---

## 📅 Week 6: 근태 관리 시스템

### Task 6.1: Prisma 스키마 확장 (Attendance 모델)

**파일**: `prisma/schema.prisma`
**작업 위치**: 기존 파일에 추가
**예상 라인**: +80 라인

```prisma
// Attendance (근태) 모델
model Attendance {
  id          String   @id @default(uuid())
  userId      String   @map("user_id")
  siteId      String   @map("site_id")
  date        DateTime // 근무 날짜

  // 체크인 정보
  checkInTime DateTime? @map("check_in_time")
  checkInLat  Float?    @map("check_in_lat")
  checkInLng  Float?    @map("check_in_lng")
  checkInValid Boolean? @map("check_in_valid") // Geofencing 검증 결과

  // 체크아웃 정보
  checkOutTime DateTime? @map("check_out_time")
  checkOutLat  Float?    @map("check_out_lat")
  checkOutLng  Float?    @map("check_out_lng")
  checkOutValid Boolean? @map("check_out_valid")

  // 비교 대상 (설정된 근무 시간)
  expectedCheckIn  DateTime @map("expected_check_in")
  expectedCheckOut DateTime @map("expected_check_out")

  // 지각/조퇴 여부
  isLate       Boolean @default(false) @map("is_late")
  isEarlyLeave Boolean @default(false) @map("is_early_leave")

  // 메타데이터
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")
  deletedAt   DateTime? @map("deleted_at")

  // Relations
  user        User     @relation(fields: [userId], references: [id])
  site        Site     @relation(fields: [siteId], references: [id])

  @@unique([userId, siteId, date])
  @@index([userId, date])
  @@index([siteId, date])
  @@map("attendances")
}

// Site 모델에 근무 시간 설정 추가
model Site {
  // 기존 필드들...

  // 근무 시간 설정
  workStartTime String? @map("work_start_time") // "09:00" 형식
  workEndTime   String? @map("work_end_time")   // "18:00" 형식

  attendances   Attendance[]
}

// User 모델에 relation 추가
model User {
  // 기존 필드들...

  attendances  Attendance[]
}
```

**마이그레이션**:
```bash
npx prisma migrate dev --name add_attendance_model
npx prisma generate
```

---

### Task 6.2: Attendance Service

**파일**: `src/services/attendance.service.ts` (신규 생성)
**예상 라인**: 700-900 라인

```typescript
import { PrismaClient } from '@prisma/client';
import { redis } from '../config/redis';
import { checkGeofencing } from '../utils/geofencing.util';
import { NotFoundError, ForbiddenError } from '../utils/errors.util';
import { sendNotification } from '../utils/notification.util';

const prisma = new PrismaClient();

// Lines 1-40: 타입 정의
export interface CheckInDto {
  siteId: string;
  latitude: number;
  longitude: number;
}

export interface CheckOutDto {
  attendanceId: string;
  latitude: number;
  longitude: number;
}

export interface AttendanceFilter {
  userId?: string;
  siteId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  isLate?: boolean;
  isEarlyLeave?: boolean;
}

// Lines 45-180: 출근 체크인
/**
 * 출근 체크인
 * @description GPS 위치를 기록하고 geofencing 검증을 수행합니다
 */
export async function checkIn(
  dto: CheckInDto,
  userId: string
): Promise<any> {
  // 사업장 조회
  const site = await prisma.site.findUnique({
    where: { id: dto.siteId },
  });

  if (!site || !site.isActive || site.deletedAt) {
    throw new NotFoundError('Site not found or inactive');
  }

  // GPS 검증 (사업장 반경 100m 이내)
  const isValidLocation = checkGeofencing(
    { lat: dto.latitude, lng: dto.longitude },
    { lat: site.latitude, lng: site.longitude },
    100
  );

  // 오늘 날짜
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // 기존 출근 기록 확인
  const existing = await prisma.attendance.findFirst({
    where: {
      userId,
      siteId: dto.siteId,
      date: today,
      deletedAt: null,
    },
  });

  if (existing && existing.checkInTime) {
    throw new Error('Already checked in today');
  }

  // 예상 출근 시간 (사업장 설정 또는 기본값)
  const expectedCheckIn = new Date(today);
  const [hours, minutes] = (site.workStartTime || '09:00').split(':');
  expectedCheckIn.setHours(parseInt(hours), parseInt(minutes), 0, 0);

  const expectedCheckOut = new Date(today);
  const [hours2, minutes2] = (site.workEndTime || '18:00').split(':');
  expectedCheckOut.setHours(parseInt(hours2), parseInt(minutes2), 0, 0);

  const now = new Date();

  // 지각 여부 판단
  const isLate = now > expectedCheckIn;

  // 출근 기록 생성 또는 업데이트
  const attendance = existing
    ? await prisma.attendance.update({
        where: { id: existing.id },
        data: {
          checkInTime: now,
          checkInLat: dto.latitude,
          checkInLng: dto.longitude,
          checkInValid: isValidLocation,
          isLate,
        },
        include: {
          site: true,
          user: {
            select: { id: true, name: true, email: true },
          },
        },
      })
    : await prisma.attendance.create({
        data: {
          userId,
          siteId: dto.siteId,
          date: today,
          checkInTime: now,
          checkInLat: dto.latitude,
          checkInLng: dto.longitude,
          checkInValid: isValidLocation,
          expectedCheckIn,
          expectedCheckOut,
          isLate,
        },
        include: {
          site: true,
          user: {
            select: { id: true, name: true, email: true },
          },
        },
      });

  // 캐시 무효화
  await invalidateAttendanceCache(userId, dto.siteId);

  // 비정상 알림
  if (!isValidLocation || isLate) {
    await sendNotification({
      type: 'ABNORMAL_CHECK_IN',
      targetUserIds: [userId], // 관리자에게도 보낼 수 있음
      data: {
        attendanceId: attendance.id,
        siteName: site.name,
        isValidLocation,
        isLate,
        checkInTime: now,
        expectedTime: expectedCheckIn,
      },
    });
  }

  return attendance;
}

// Lines 185-320: 퇴근 체크아웃
/**
 * 퇴근 체크아웃
 * @description GPS 위치를 기록하고 geofencing 검증을 수행합니다
 */
export async function checkOut(
  dto: CheckOutDto,
  userId: string
): Promise<any> {
  // 출근 기록 조회
  const attendance = await prisma.attendance.findUnique({
    where: { id: dto.attendanceId },
    include: { site: true },
  });

  if (!attendance || attendance.deletedAt) {
    throw new NotFoundError('Attendance record not found');
  }

  // 권한 체크 (본인만)
  if (attendance.userId !== userId) {
    throw new ForbiddenError('Only owner can check out');
  }

  // 체크인 안 했으면 에러
  if (!attendance.checkInTime) {
    throw new Error('Must check in first');
  }

  // 이미 체크아웃 했으면 에러
  if (attendance.checkOutTime) {
    throw new Error('Already checked out');
  }

  // GPS 검증
  const isValidLocation = checkGeofencing(
    { lat: dto.latitude, lng: dto.longitude },
    { lat: attendance.site.latitude, lng: attendance.site.longitude },
    100
  );

  const now = new Date();

  // 조퇴 여부 판단
  const isEarlyLeave = now < attendance.expectedCheckOut;

  // 체크아웃 업데이트
  const updated = await prisma.attendance.update({
    where: { id: dto.attendanceId },
    data: {
      checkOutTime: now,
      checkOutLat: dto.latitude,
      checkOutLng: dto.longitude,
      checkOutValid: isValidLocation,
      isEarlyLeave,
    },
    include: {
      site: true,
      user: {
        select: { id: true, name: true, email: true },
      },
    },
  });

  // 캐시 무효화
  await invalidateAttendanceCache(userId, attendance.siteId);

  // 비정상 알림
  if (!isValidLocation || isEarlyLeave) {
    await sendNotification({
      type: 'ABNORMAL_CHECK_OUT',
      targetUserIds: [userId],
      data: {
        attendanceId: updated.id,
        siteName: attendance.site.name,
        isValidLocation,
        isEarlyLeave,
        checkOutTime: now,
        expectedTime: attendance.expectedCheckOut,
      },
    });
  }

  return updated;
}

// Lines 325-450: 근태 기록 조회
/**
 * 근태 기록 조회
 * @description 필터링 및 정렬 지원
 */
export async function getAttendances(filter: AttendanceFilter): Promise<any[]> {
  // 캐시 키 생성
  const cacheKey = `attendances:${JSON.stringify(filter)}`;

  // Redis 캐시 확인
  const cached = await redis.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }

  // 필터 조건 구성
  const where: any = {
    deletedAt: null,
  };

  if (filter.userId) {
    where.userId = filter.userId;
  }

  if (filter.siteId) {
    where.siteId = filter.siteId;
  }

  if (filter.dateFrom || filter.dateTo) {
    where.date = {};
    if (filter.dateFrom) where.date.gte = filter.dateFrom;
    if (filter.dateTo) where.date.lte = filter.dateTo;
  }

  if (filter.isLate !== undefined) {
    where.isLate = filter.isLate;
  }

  if (filter.isEarlyLeave !== undefined) {
    where.isEarlyLeave = filter.isEarlyLeave;
  }

  // 조회
  const attendances = await prisma.attendance.findMany({
    where,
    include: {
      site: {
        select: { id: true, name: true, type: true },
      },
      user: {
        select: { id: true, name: true, email: true },
      },
    },
    orderBy: [
      { date: 'desc' },
      { checkInTime: 'desc' },
    ],
  });

  // 캐시 저장 (5분)
  await redis.setex(cacheKey, 300, JSON.stringify(attendances));

  return attendances;
}

// Lines 455-580: 근태 통계
/**
 * 근태 통계
 * @description 출근율, 지각률, 조퇴율 등 계산
 */
export async function getAttendanceStatistics(
  userId: string,
  dateFrom: Date,
  dateTo: Date
): Promise<any> {
  const cacheKey = `attendance-stats:${userId}:${dateFrom.toISOString()}:${dateTo.toISOString()}`;

  // Redis 캐시 확인
  const cached = await redis.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }

  const attendances = await getAttendances({
    userId,
    dateFrom,
    dateTo,
  });

  // 통계 계산
  const total = attendances.length;
  const checkedIn = attendances.filter(a => a.checkInTime).length;
  const checkedOut = attendances.filter(a => a.checkOutTime).length;
  const late = attendances.filter(a => a.isLate).length;
  const earlyLeave = attendances.filter(a => a.isEarlyLeave).length;
  const invalidCheckIn = attendances.filter(a => a.checkInValid === false).length;
  const invalidCheckOut = attendances.filter(a => a.checkOutValid === false).length;

  const stats = {
    total,
    checkedIn,
    checkedOut,
    late,
    earlyLeave,
    invalidCheckIn,
    invalidCheckOut,
    attendanceRate: total > 0 ? (checkedIn / total) * 100 : 0,
    lateRate: total > 0 ? (late / total) * 100 : 0,
    earlyLeaveRate: total > 0 ? (earlyLeave / total) * 100 : 0,
  };

  // 캐시 저장 (10분)
  await redis.setex(cacheKey, 600, JSON.stringify(stats));

  return stats;
}

// Lines 585-700: 사업장별 근태 통계
/**
 * 사업장별 근태 통계
 */
export async function getSiteAttendanceStatistics(
  siteId: string,
  dateFrom: Date,
  dateTo: Date
): Promise<any> {
  const cacheKey = `site-attendance-stats:${siteId}:${dateFrom.toISOString()}:${dateTo.toISOString()}`;

  const cached = await redis.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }

  const attendances = await getAttendances({
    siteId,
    dateFrom,
    dateTo,
  });

  // 담당자별 통계
  const byUser = attendances.reduce((acc, att) => {
    const userId = att.userId;

    if (!acc[userId]) {
      acc[userId] = {
        user: att.user,
        total: 0,
        checkedIn: 0,
        late: 0,
        earlyLeave: 0,
      };
    }

    acc[userId].total += 1;
    if (att.checkInTime) acc[userId].checkedIn += 1;
    if (att.isLate) acc[userId].late += 1;
    if (att.isEarlyLeave) acc[userId].earlyLeave += 1;

    return acc;
  }, {} as Record<string, any>);

  const stats = {
    totalRecords: attendances.length,
    byUser: Object.values(byUser),
  };

  await redis.setex(cacheKey, 600, JSON.stringify(stats));

  return stats;
}

// Lines 705-800: 비정상 출근 조회
/**
 * 비정상 출근 기록 조회
 * @description GPS 검증 실패 또는 지각/조퇴 기록
 */
export async function getAbnormalAttendances(
  dateFrom: Date,
  dateTo: Date
): Promise<any> {
  const attendances = await getAttendances({
    dateFrom,
    dateTo,
  });

  // 비정상 기록 필터링
  const abnormal = attendances.filter(
    a =>
      a.checkInValid === false ||
      a.checkOutValid === false ||
      a.isLate ||
      a.isEarlyLeave
  );

  return {
    total: abnormal.length,
    invalidLocation: abnormal.filter(
      a => a.checkInValid === false || a.checkOutValid === false
    ),
    late: abnormal.filter(a => a.isLate),
    earlyLeave: abnormal.filter(a => a.isEarlyLeave),
  };
}

// Lines 805-900: 헬퍼 함수
async function invalidateAttendanceCache(userId: string, siteId: string): Promise<void> {
  const keys = await redis.keys(`attendances:*${userId}*`);
  const siteKeys = await redis.keys(`site-attendance-stats:${siteId}*`);
  const statKeys = await redis.keys(`attendance-stats:*`);

  const allKeys = [...keys, ...siteKeys, ...statKeys];

  if (allKeys.length > 0) {
    await redis.del(...allKeys);
  }
}

/**
 * 근태 수정 (관리자만)
 */
export async function updateAttendance(
  attendanceId: string,
  updateData: any,
  userRole: string
): Promise<any> {
  if (userRole !== 'ADMIN') {
    throw new ForbiddenError('Only admin can update attendance');
  }

  const attendance = await prisma.attendance.findUnique({
    where: { id: attendanceId },
  });

  if (!attendance || attendance.deletedAt) {
    throw new NotFoundError('Attendance not found');
  }

  const updated = await prisma.attendance.update({
    where: { id: attendanceId },
    data: updateData,
    include: {
      site: true,
      user: true,
    },
  });

  await invalidateAttendanceCache(attendance.userId, attendance.siteId);

  return updated;
}
```

---

### Task 6.3: Attendance Controller & Routes

**파일**: `src/controllers/attendance.controller.ts` (신규 생성)
**예상 라인**: 400-500 라인

```typescript
import { Request, Response } from 'express';
import * as attendanceService from '../services/attendance.service';
import { successResponse, errorResponse } from '../utils/api-response.util';

// Lines 1-60: 출근 체크인
export async function checkIn(req: Request, res: Response) {
  try {
    const { siteId, latitude, longitude } = req.body;

    const attendance = await attendanceService.checkIn(
      {
        siteId,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
      },
      req.user!.userId
    );

    return res.status(201).json(successResponse(attendance, 'Check-in successful'));
  } catch (error) {
    return res.status(400).json(errorResponse(error.message));
  }
}

// Lines 65-120: 퇴근 체크아웃
export async function checkOut(req: Request, res: Response) {
  try {
    const { attendanceId, latitude, longitude } = req.body;

    const attendance = await attendanceService.checkOut(
      {
        attendanceId,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
      },
      req.user!.userId
    );

    return res.json(successResponse(attendance, 'Check-out successful'));
  } catch (error) {
    return res.status(400).json(errorResponse(error.message));
  }
}

// Lines 125-200: 근태 기록 조회
export async function getAttendances(req: Request, res: Response) {
  try {
    const { userId, siteId, dateFrom, dateTo, isLate, isEarlyLeave } = req.query;

    const filter: any = {};

    if (userId) filter.userId = userId as string;
    if (siteId) filter.siteId = siteId as string;
    if (dateFrom) filter.dateFrom = new Date(dateFrom as string);
    if (dateTo) filter.dateTo = new Date(dateTo as string);
    if (isLate !== undefined) filter.isLate = isLate === 'true';
    if (isEarlyLeave !== undefined) filter.isEarlyLeave = isEarlyLeave === 'true';

    const attendances = await attendanceService.getAttendances(filter);

    return res.json(successResponse(attendances));
  } catch (error) {
    return res.status(400).json(errorResponse(error.message));
  }
}

// Lines 205-270: 근태 통계 (개인)
export async function getAttendanceStatistics(req: Request, res: Response) {
  try {
    const { userId, dateFrom, dateTo } = req.query;

    const stats = await attendanceService.getAttendanceStatistics(
      (userId as string) || req.user!.userId,
      new Date(dateFrom as string),
      new Date(dateTo as string)
    );

    return res.json(successResponse(stats));
  } catch (error) {
    return res.status(400).json(errorResponse(error.message));
  }
}

// Lines 275-340: 사업장별 근태 통계
export async function getSiteAttendanceStatistics(req: Request, res: Response) {
  try {
    const { siteId } = req.params;
    const { dateFrom, dateTo } = req.query;

    const stats = await attendanceService.getSiteAttendanceStatistics(
      siteId,
      new Date(dateFrom as string),
      new Date(dateTo as string)
    );

    return res.json(successResponse(stats));
  } catch (error) {
    return res.status(400).json(errorResponse(error.message));
  }
}

// Lines 345-400: 비정상 출근 조회
export async function getAbnormalAttendances(req: Request, res: Response) {
  try {
    const { dateFrom, dateTo } = req.query;

    const abnormal = await attendanceService.getAbnormalAttendances(
      new Date(dateFrom as string),
      new Date(dateTo as string)
    );

    return res.json(successResponse(abnormal));
  } catch (error) {
    return res.status(400).json(errorResponse(error.message));
  }
}

// Lines 405-460: 근태 수정 (관리자)
export async function updateAttendance(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const attendance = await attendanceService.updateAttendance(
      id,
      updateData,
      req.user!.role
    );

    return res.json(successResponse(attendance, 'Attendance updated'));
  } catch (error) {
    return res.status(400).json(errorResponse(error.message));
  }
}
```

**파일**: `src/routes/attendance.routes.ts` (신규 생성)
**예상 라인**: 100-150 라인

```typescript
import { Router } from 'express';
import * as attendanceController from '../controllers/attendance.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

router.post(
  '/check-in',
  authenticate,
  authorize(['STAFF']),
  attendanceController.checkIn
);

router.post(
  '/check-out',
  authenticate,
  authorize(['STAFF']),
  attendanceController.checkOut
);

router.get(
  '/',
  authenticate,
  attendanceController.getAttendances
);

router.get(
  '/statistics',
  authenticate,
  attendanceController.getAttendanceStatistics
);

router.get(
  '/site/:siteId/statistics',
  authenticate,
  authorize(['ADMIN']),
  attendanceController.getSiteAttendanceStatistics
);

router.get(
  '/abnormal',
  authenticate,
  authorize(['ADMIN']),
  attendanceController.getAbnormalAttendances
);

router.patch(
  '/:id',
  authenticate,
  authorize(['ADMIN']),
  attendanceController.updateAttendance
);

export default router;
```

---

## 📅 Week 7: 통계 및 대시보드 API

### Task 7.1: Dashboard Service

**파일**: `src/services/dashboard.service.ts` (신규 생성)
**예상 라인**: 600-800 라인

```typescript
import { PrismaClient } from '@prisma/client';
import { redis } from '../config/redis';
import * as feedbackService from './customer-feedback.service';
import * as attendanceService from './attendance.service';

const prisma = new PrismaClient();

// Lines 1-30: 타입 정의
export interface DashboardSummary {
  sites: SiteSummary;
  feedbacks: FeedbackSummary;
  attendances: AttendanceSummary;
  staff: StaffSummary;
}

interface SiteSummary {
  total: number;
  byType: Record<string, number>;
  byDivision: Record<string, number>;
}

// Lines 35-250: 대시보드 요약 통계
/**
 * 대시보드 요약 통계
 * @description 전체 시스템의 주요 지표를 조회합니다
 */
export async function getDashboardSummary(
  dateFrom: Date,
  dateTo: Date,
  division?: string
): Promise<DashboardSummary> {
  const cacheKey = `dashboard-summary:${division || 'all'}:${dateFrom.toISOString()}:${dateTo.toISOString()}`;

  // Redis 캐시 확인
  const cached = await redis.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }

  // 사업장 통계
  const siteWhere: any = {
    isActive: true,
    deletedAt: null,
  };

  if (division) {
    siteWhere.division = division;
  }

  const [totalSites, sitesByType, sitesByDivision] = await Promise.all([
    prisma.site.count({ where: siteWhere }),

    prisma.site.groupBy({
      by: ['type'],
      where: siteWhere,
      _count: true,
    }),

    prisma.site.groupBy({
      by: ['division'],
      where: siteWhere,
      _count: true,
    }),
  ]);

  // VOC 통계
  const feedbackStats = await feedbackService.getFeedbackStatistics(
    dateFrom,
    dateTo
  );

  // 근태 통계 (전체 사용자)
  const attendances = await attendanceService.getAttendances({
    dateFrom,
    dateTo,
  });

  const totalAttendances = attendances.length;
  const lateCount = attendances.filter(a => a.isLate).length;
  const earlyLeaveCount = attendances.filter(a => a.isEarlyLeave).length;

  // 담당자 통계
  const totalStaff = await prisma.user.count({
    where: {
      role: 'STAFF',
      isActive: true,
    },
  });

  const summary: DashboardSummary = {
    sites: {
      total: totalSites,
      byType: sitesByType.reduce((acc, item) => {
        acc[item.type] = item._count;
        return acc;
      }, {} as Record<string, number>),
      byDivision: sitesByDivision.reduce((acc, item) => {
        acc[item.division] = item._count;
        return acc;
      }, {} as Record<string, number>),
    },
    feedbacks: {
      total: feedbackStats.total,
      pending: feedbackStats.byStatus['PENDING'] || 0,
      inProgress: feedbackStats.byStatus['IN_PROGRESS'] || 0,
      resolved: feedbackStats.byStatus['RESOLVED'] || 0,
      averageRating: feedbackStats.averageRating,
    } as FeedbackSummary,
    attendances: {
      total: totalAttendances,
      late: lateCount,
      earlyLeave: earlyLeaveCount,
      lateRate: totalAttendances > 0 ? (lateCount / totalAttendances) * 100 : 0,
    } as AttendanceSummary,
    staff: {
      total: totalStaff,
    } as StaffSummary,
  };

  // 캐시 저장 (15분)
  await redis.setex(cacheKey, 900, JSON.stringify(summary));

  return summary;
}

// Lines 255-400: 사업장별 상세 통계
/**
 * 사업장별 상세 통계
 */
export async function getSiteDetailStats(
  siteId: string,
  dateFrom: Date,
  dateTo: Date
): Promise<any> {
  const cacheKey = `site-detail-stats:${siteId}:${dateFrom.toISOString()}:${dateTo.toISOString()}`;

  const cached = await redis.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }

  // 사업장 정보
  const site = await prisma.site.findUnique({
    where: { id: siteId },
    include: {
      staffSites: {
        include: {
          staff: {
            include: { user: true },
          },
        },
      },
    },
  });

  if (!site) {
    throw new Error('Site not found');
  }

  // VOC 통계
  const feedbackStats = await feedbackService.getFeedbackStatistics(
    dateFrom,
    dateTo,
    siteId
  );

  // 근태 통계
  const attendanceStats = await attendanceService.getSiteAttendanceStatistics(
    siteId,
    dateFrom,
    dateTo
  );

  // 식단 통계
  const menuCount = await prisma.menu.count({
    where: {
      siteId,
      date: {
        gte: dateFrom,
        lte: dateTo,
      },
      deletedAt: null,
    },
  });

  // 배식 사진 통계
  const photoCount = await prisma.mealPhoto.count({
    where: {
      siteId,
      photoDate: {
        gte: dateFrom,
        lte: dateTo,
      },
      deletedAt: null,
    },
  });

  const stats = {
    site: {
      id: site.id,
      name: site.name,
      type: site.type,
      division: site.division,
    },
    staff: site.staffSites.map(ss => ({
      id: ss.staff.user.id,
      name: ss.staff.user.name,
      averageRating: ss.staff.user.averageRating,
    })),
    feedbacks: feedbackStats,
    attendances: attendanceStats,
    menus: {
      total: menuCount,
    },
    photos: {
      total: photoCount,
    },
  };

  await redis.setex(cacheKey, 900, JSON.stringify(stats));

  return stats;
}

// Lines 405-550: 담당자별 성과 통계
/**
 * 담당자별 성과 통계
 */
export async function getStaffPerformance(
  userId: string,
  dateFrom: Date,
  dateTo: Date
): Promise<any> {
  const cacheKey = `staff-performance:${userId}:${dateFrom.toISOString()}:${dateTo.toISOString()}`;

  const cached = await redis.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }

  // 담당자 정보
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      staffProfile: {
        include: {
          staffSites: {
            include: { site: true },
          },
        },
      },
    },
  });

  if (!user || user.role !== 'STAFF') {
    throw new Error('Staff not found');
  }

  // 근태 통계
  const attendanceStats = await attendanceService.getAttendanceStatistics(
    userId,
    dateFrom,
    dateTo
  );

  // VOC 통계 (담당자가 작성한 VOC)
  const createdFeedbacks = await feedbackService.getFeedbacks({
    createdBy: userId,
    dateFrom,
    dateTo,
  });

  // 담당 사업장들
  const sites = user.staffProfile?.staffSites.map(ss => ss.site) || [];

  // 담당 사업장의 평균 별점
  const avgRating = user.averageRating || 0;

  // 배식 사진 업로드 수
  const uploadedPhotos = await prisma.mealPhoto.count({
    where: {
      uploadedBy: userId,
      photoDate: {
        gte: dateFrom,
        lte: dateTo,
      },
      deletedAt: null,
    },
  });

  const performance = {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      averageRating: avgRating,
    },
    sites: sites.map(s => ({
      id: s.id,
      name: s.name,
      type: s.type,
    })),
    attendance: attendanceStats,
    feedbacks: {
      total: createdFeedbacks.length,
    },
    photos: {
      uploaded: uploadedPhotos,
    },
  };

  await redis.setex(cacheKey, 900, JSON.stringify(performance));

  return performance;
}

// Lines 555-700: 부문별 비교 통계
/**
 * 부문별 비교 통계
 */
export async function getDivisionComparison(
  dateFrom: Date,
  dateTo: Date
): Promise<any> {
  const cacheKey = `division-comparison:${dateFrom.toISOString()}:${dateTo.toISOString()}`;

  const cached = await redis.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }

  const divisions = ['본사', '영남지사']; // 하드코딩 또는 DB에서 조회

  const comparisonData = await Promise.all(
    divisions.map(async division => {
      const summary = await getDashboardSummary(dateFrom, dateTo, division);

      return {
        division,
        summary,
      };
    })
  );

  await redis.setex(cacheKey, 900, JSON.stringify(comparisonData));

  return comparisonData;
}

// Lines 705-800: 일별 트렌드 데이터
/**
 * 일별 트렌드 데이터 (VOC, 근태 등)
 */
export async function getDailyTrends(
  dateFrom: Date,
  dateTo: Date
): Promise<any> {
  const cacheKey = `daily-trends:${dateFrom.toISOString()}:${dateTo.toISOString()}`;

  const cached = await redis.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }

  // 일별로 데이터 집계
  const days: any[] = [];
  const currentDate = new Date(dateFrom);

  while (currentDate <= dateTo) {
    const dayStart = new Date(currentDate);
    dayStart.setHours(0, 0, 0, 0);

    const dayEnd = new Date(currentDate);
    dayEnd.setHours(23, 59, 59, 999);

    const [feedbackCount, attendanceCount] = await Promise.all([
      prisma.customerFeedback.count({
        where: {
          createdAt: {
            gte: dayStart,
            lte: dayEnd,
          },
          deletedAt: null,
        },
      }),

      prisma.attendance.count({
        where: {
          date: dayStart,
          deletedAt: null,
        },
      }),
    ]);

    days.push({
      date: dayStart.toISOString().split('T')[0],
      feedbacks: feedbackCount,
      attendances: attendanceCount,
    });

    currentDate.setDate(currentDate.getDate() + 1);
  }

  await redis.setex(cacheKey, 900, JSON.stringify(days));

  return days;
}
```

---

### Task 7.2: Dashboard Controller & Routes

**파일**: `src/controllers/dashboard.controller.ts` (신규 생성)
**예상 라인**: 300-400 라인

```typescript
import { Request, Response } from 'express';
import * as dashboardService from '../services/dashboard.service';
import { successResponse, errorResponse } from '../utils/api-response.util';

export async function getDashboardSummary(req: Request, res: Response) {
  try {
    const { dateFrom, dateTo, division } = req.query;

    const summary = await dashboardService.getDashboardSummary(
      new Date(dateFrom as string),
      new Date(dateTo as string),
      division as string
    );

    return res.json(successResponse(summary));
  } catch (error) {
    return res.status(400).json(errorResponse(error.message));
  }
}

export async function getSiteDetailStats(req: Request, res: Response) {
  try {
    const { siteId } = req.params;
    const { dateFrom, dateTo } = req.query;

    const stats = await dashboardService.getSiteDetailStats(
      siteId,
      new Date(dateFrom as string),
      new Date(dateTo as string)
    );

    return res.json(successResponse(stats));
  } catch (error) {
    return res.status(400).json(errorResponse(error.message));
  }
}

export async function getStaffPerformance(req: Request, res: Response) {
  try {
    const { userId } = req.params;
    const { dateFrom, dateTo } = req.query;

    const performance = await dashboardService.getStaffPerformance(
      userId,
      new Date(dateFrom as string),
      new Date(dateTo as string)
    );

    return res.json(successResponse(performance));
  } catch (error) {
    return res.status(400).json(errorResponse(error.message));
  }
}

export async function getDivisionComparison(req: Request, res: Response) {
  try {
    const { dateFrom, dateTo } = req.query;

    const comparison = await dashboardService.getDivisionComparison(
      new Date(dateFrom as string),
      new Date(dateTo as string)
    );

    return res.json(successResponse(comparison));
  } catch (error) {
    return res.status(400).json(errorResponse(error.message));
  }
}

export async function getDailyTrends(req: Request, res: Response) {
  try {
    const { dateFrom, dateTo } = req.query;

    const trends = await dashboardService.getDailyTrends(
      new Date(dateFrom as string),
      new Date(dateTo as string)
    );

    return res.json(successResponse(trends));
  } catch (error) {
    return res.status(400).json(errorResponse(error.message));
  }
}
```

**파일**: `src/routes/dashboard.routes.ts` (신규 생성)

```typescript
import { Router } from 'express';
import * as dashboardController from '../controllers/dashboard.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

router.get(
  '/summary',
  authenticate,
  authorize(['ADMIN']),
  dashboardController.getDashboardSummary
);

router.get(
  '/site/:siteId',
  authenticate,
  authorize(['ADMIN']),
  dashboardController.getSiteDetailStats
);

router.get(
  '/staff/:userId',
  authenticate,
  authorize(['ADMIN', 'STAFF']),
  dashboardController.getStaffPerformance
);

router.get(
  '/division-comparison',
  authenticate,
  authorize(['ADMIN']),
  dashboardController.getDivisionComparison
);

router.get(
  '/trends',
  authenticate,
  authorize(['ADMIN']),
  dashboardController.getDailyTrends
);

export default router;
```

---

### Task 7.3: Notification Utility (기본 구현)

**파일**: `src/utils/notification.util.ts` (신규 생성)
**예상 라인**: 200-300 라인

```typescript
// Lines 1-30: 타입 정의
export interface NotificationData {
  type: string;
  targetUserIds: string[];
  data: Record<string, any>;
}

// Lines 35-150: 알림 발송 (기본 구현)
/**
 * 알림 발송
 * @description 기본 로직만 구현 (FCM은 Phase 5에서 추가)
 */
export async function sendNotification(notificationData: NotificationData): Promise<void> {
  // 현재는 로그만 출력
  console.log('Notification:', {
    type: notificationData.type,
    targets: notificationData.targetUserIds,
    data: notificationData.data,
  });

  // TODO Phase 5: FCM 연동
  // - Firebase Admin SDK 사용
  // - 사용자별 디바이스 토큰 조회
  // - FCM 푸시 발송
}

// Lines 155-250: 알림 타입별 메시지 포맷팅
export function formatNotificationMessage(type: string, data: Record<string, any>): string {
  switch (type) {
    case 'NEW_FEEDBACK':
      return `새로운 VOC가 등록되었습니다. (${data.siteName}, 별점: ${data.rating})`;

    case 'FEEDBACK_RESPONSE':
      return `VOC에 답변이 등록되었습니다. (${data.siteName})`;

    case 'PENDING_FEEDBACKS_ALERT':
      return `미처리 VOC ${data.count}건이 있습니다.`;

    case 'ABNORMAL_CHECK_IN':
      return data.isValidLocation
        ? `지각 출근 (${data.siteName})`
        : `비정상 위치 출근 (${data.siteName})`;

    case 'ABNORMAL_CHECK_OUT':
      return data.isValidLocation
        ? `조퇴 (${data.siteName})`
        : `비정상 위치 퇴근 (${data.siteName})`;

    default:
      return 'New notification';
  }
}
```

---

## ✅ Phase 3 완료 체크리스트

### Week 5: VOC 시스템 (4개 작업)
- [x] Task 5.1: Prisma 스키마 확장 (CustomerFeedback + **FeedbackImage**) ✅
- [x] Task 5.2: Feedback Service (**이미지 업로드 포함**) ✅
- [x] Task 5.3: Feedback Controller ✅
- [x] Task 5.4: Feedback Routes & Validator ✅
- [ ] ~~Task 5.5: 담당자 평균 별점 자동 계산~~ ⚠️ 미구현
- [ ] ~~Task 5.6: 미처리 VOC 알림~~ ⚠️ 미구현

### Week 6: 근태 관리 (4개 작업)
- [x] Task 6.1: Prisma 스키마 확장 (Attendance + **AttendanceSetting**) ✅
- [x] Task 6.2: Attendance Service ✅
- [x] Task 6.3: Attendance Controller & Routes & Validator ✅
- [x] Task 6.4: **AttendanceSetting CRUD** (추가 구현) ✅
- [ ] ~~Task 6.5: 비정상 출근 알림~~ ⚠️ 미구현
- [ ] ~~Task 6.6: 근태 수정 (관리자)~~ ⚠️ 미구현

### Week 7: 통계 및 대시보드 (3개 작업)
- [x] Task 7.1: Dashboard Service (**기본 요약만**) ✅
- [x] Task 7.2: Dashboard Controller & Routes ✅
- [ ] ~~Task 7.3: Notification Utility~~ ❌ 미구현 (Phase 5 예정)
- [ ] ~~Task 7.4: 사업장별 상세 통계~~ ❌ 미구현
- [ ] ~~Task 7.5: 담당자별 성과 통계~~ ❌ 미구현
- [ ] ~~Task 7.6: 부문별 비교 통계~~ ❌ 미구현
- [ ] ~~Task 7.7: 일별 트렌드 데이터~~ ❌ 미구현

### 통합 테스트
- [x] VOC 생성 및 답변 테스트 ✅
- [x] **VOC 이미지 첨부 테스트** (최대 6개) ✅
- [x] 별점 시스템 작동 확인 ✅
- [ ] ~~담당자 평균 별점 자동 계산 확인~~ ⚠️ 미구현
- [x] 출퇴근 체크인/체크아웃 테스트 ✅
- [x] GPS 검증 (Geofencing) 테스트 ✅
- [x] **Status Enum 기반 상태 관리** ✅
- [x] **AttendanceSetting 관리** ✅
- [x] 대시보드 기본 통계 확인 ✅
- [x] Redis 캐싱 동작 확인 ✅

---

## 📝 Agent 인계 템플릿

```
=== Phase 3 완료 보고 ===

완료한 작업:
- Week 5: VOC 시스템 (4개 Task)
- Week 6: 근태 관리 (3개 Task)
- Week 7: 통계 및 대시보드 (3개 Task)

생성된 파일:
1. prisma/schema.prisma (CustomerFeedback, Attendance 모델 추가)
2. src/services/customer-feedback.service.ts [700-900 라인]
3. src/controllers/customer-feedback.controller.ts [400-500 라인]
4. src/routes/customer-feedback.routes.ts [100-150 라인]
5. src/services/attendance.service.ts [700-900 라인]
6. src/controllers/attendance.controller.ts [400-500 라인]
7. src/routes/attendance.routes.ts [100-150 라인]
8. src/services/dashboard.service.ts [600-800 라인]
9. src/controllers/dashboard.controller.ts [300-400 라인]
10. src/routes/dashboard.routes.ts [80-100 라인]
11. src/utils/notification.util.ts [200-300 라인]

테스트 완료:
- [x] VOC CRUD 및 별점 시스템
- [x] 담당자 평균 별점 자동 계산
- [x] 출퇴근 GPS 검증
- [x] 지각/조퇴 판단
- [x] 대시보드 통계 API

주의사항:
- GPS 검증 반경: 100m
- 미처리 VOC 알림: 24시간 기준
- Redis 캐시: 통계 데이터 15분

다음 단계:
- Phase 4 (웹 프론트엔드) 진행
```

---

## 📌 다음 Phase 안내

**Phase 4**: 웹 프론트엔드 (2주)
- Week 8: React 웹 프로젝트 기본 구조
- Week 9: 관리자 웹 핵심 기능

**파일**: `구현_가이드_Phase4.md` 참조

---

## 📊 Phase 3 실제 구현 상태 (2025-10-12 기준)

### ✅ 완료된 기능

| 기능 분류 | 상세 기능 | 구현 상태 | 참고 |
|---------|---------|----------|------|
| **VOC 시스템** | 기본 CRUD | ✅ 완료 | feedback.service.ts |
| | **이미지 첨부** (최대 6개) | ✅ 완료 | **FeedbackImage 모델** (가이드에 없음) |
| | 별점 시스템 (1-5점) | ✅ 완료 | - |
| | 관리자 답변 | ✅ 완료 | replyToFeedback |
| | 상태 관리 | ✅ 완료 | PENDING/IN_PROGRESS/RESOLVED/**CLOSED** |
| | 통계 조회 | ✅ 완료 | getFeedbackStatistics |
| | 담당자 평균 별점 | ⚠️ 미구현 | updateStaffAverageRating 함수 없음 |
| | 미처리 VOC 알림 | ⚠️ 미구현 | notifyPendingFeedbacks 함수 없음 |
| **근태 관리** | 체크인/체크아웃 | ✅ 완료 | checkIn, checkOut |
| | GPS 검증 (100m) | ✅ 완료 | Geofencing 사용 |
| | **Status Enum 관리** | ✅ 완료 | **NORMAL/LATE/EARLY_LEAVE/OUTSIDE_RANGE** |
| | **AttendanceSetting** | ✅ 완료 | **별도 모델** (가이드와 다름) |
| | 근태 통계 | ✅ 완료 | getAttendanceStatistics |
| | 사업장별 근태 통계 | ✅ 완료 | getSiteAttendanceStatistics |
| | 비정상 출근 조회 | ⚠️ 미구현 | getAbnormalAttendances 함수 없음 |
| | 근태 수정 (관리자) | ⚠️ 미구현 | updateAttendance 함수 없음 |
| **대시보드** | 기본 요약 통계 | ✅ 완료 | getDashboardSummary (간소화됨) |
| | 사업장별 상세 통계 | ❌ 미구현 | getSiteDetailStats 함수 없음 |
| | 담당자별 성과 통계 | ❌ 미구현 | getStaffPerformance 함수 없음 |
| | 부문별 비교 통계 | ❌ 미구현 | getDivisionComparison 함수 없음 |
| | 일별 트렌드 데이터 | ❌ 미구현 | getDailyTrends 함수 없음 |
| **알림 시스템** | 기본 로직 | ❌ 미구현 | notification.util.ts 파일 없음 (Phase 5) |
| **캐싱** | Redis 캐싱 | ✅ 완료 | 통계 데이터 10-15분 |

### ⚠️ 가이드와 다른 부분

#### 1. CustomerFeedback 모델 차이

| 항목 | 가이드 명세 | 실제 구현 | 영향도 |
|------|-----------|----------|--------|
| 작성자 타입 필드 | `feedbackType: FeedbackType` | `authorType: FeedbackAuthorType` | 🟡 중간 |
| Enum 값 | `CUSTOMER` | `CLIENT` | 🔴 높음 |
| 작성자 필드 | `createdBy` | `authorId` | 🟡 중간 |
| 답변자 필드 | `respondedBy`, `respondedAt` | `repliedBy`, `repliedAt` | 🟡 중간 |
| 답변 내용 | `response` | `adminReply` | 🟡 중간 |
| 상태 Enum | PENDING, IN_PROGRESS, RESOLVED | + **CLOSED** 추가 | 🟡 중간 |
| **이미지 첨부** | ❌ 없음 | ✅ **FeedbackImage 모델** (1:N) | 🔴 높음 |
| 완료 일시 | `resolvedAt` | ❌ 없음 (repliedAt 사용) | 🟢 낮음 |

**실제 구현 스키마:**
```prisma
model CustomerFeedback {
  id           String    @id @default(uuid())
  siteId       String
  authorId     String    // createdBy → authorId
  authorType   FeedbackAuthorType @default(STAFF)  // feedbackType → authorType
  content      String    @db.Text
  rating       Int?      // 1-5
  status       FeedbackStatus @default(PENDING)
  adminReply   String?   @db.Text  // response → adminReply
  repliedBy    String?   // respondedBy → repliedBy
  repliedAt    DateTime? // respondedAt → repliedAt

  // 이미지 (가이드에 없음)
  images       FeedbackImage[]  // 최대 6개
}

model FeedbackImage {
  id           String @id @default(uuid())
  feedbackId   String
  imageUrl     String
  thumbnailUrl String?
  sortOrder    Int @default(0)  // 0-5
}

enum FeedbackAuthorType {
  STAFF
  CLIENT  // CUSTOMER → CLIENT
}

enum FeedbackStatus {
  PENDING
  IN_PROGRESS
  RESOLVED
  CLOSED  // 추가됨
}
```

#### 2. Attendance 모델 차이

| 항목 | 가이드 명세 | 실제 구현 | 영향도 |
|------|-----------|----------|--------|
| 날짜 필드 | `date: DateTime` (별도) | ❌ 없음 (checkInTime 사용) | 🟡 중간 |
| 예상 출근/퇴근 | Attendance에 포함 | ❌ AttendanceSetting으로 분리 | 🔴 높음 |
| 지각/조퇴 | `isLate`, `isEarlyLeave` (Boolean) | ❌ 없음 (status로 통합) | 🔴 높음 |
| GPS 검증 | `checkInValid`, `checkOutValid` | ❌ 없음 (status로 통합) | 🔴 높음 |
| **상태** | ❌ 없음 | ✅ **status: AttendanceStatus** | 🔴 높음 |
| **설정 관리** | Site에 workStartTime/workEndTime | ✅ **AttendanceSetting 모델** | 🔴 높음 |

**실제 구현 스키마:**
```prisma
model Attendance {
  id           String @id @default(uuid())
  userId       String
  siteId       String
  // date 필드 없음! checkInTime으로 날짜 판단

  checkInTime  DateTime
  checkInLat   Float?
  checkInLng   Float?
  // checkInValid 없음!

  checkOutTime DateTime?
  checkOutLat  Float?
  checkOutLng  Float?
  // checkOutValid 없음!

  status AttendanceStatus @default(NORMAL)  // 상태로 통합!
  note   String?
}

enum AttendanceStatus {
  NORMAL        // 정상
  LATE          // 지각 (isLate → LATE)
  EARLY_LEAVE   // 조퇴 (isEarlyLeave → EARLY_LEAVE)
  OUTSIDE_RANGE // 사업장 외부 (checkInValid=false → OUTSIDE_RANGE)
}

// 별도 모델로 분리됨 (가이드: Site 모델에 포함)
model AttendanceSetting {
  id               String @id @default(uuid())
  siteId           String
  expectedCheckIn  String  // HH:mm (DateTime → String)
  expectedCheckOut String
  allowedRadius    Int @default(100)
  isActive         Boolean @default(true)
}
```

#### 3. Dashboard Service 차이

| 기능 | 가이드 | 실제 구현 | 영향도 |
|------|-------|----------|--------|
| 기본 요약 통계 | ✅ getDashboardSummary | ✅ 구현 (단순화) | 🟡 중간 |
| 사업장별 상세 | ✅ getSiteDetailStats | ❌ 미구현 | 🔴 높음 |
| 담당자별 성과 | ✅ getStaffPerformance | ❌ 미구현 | 🔴 높음 |
| 부문별 비교 | ✅ getDivisionComparison | ❌ 미구현 | 🔴 높음 |
| 일별 트렌드 | ✅ getDailyTrends | ❌ 미구현 | 🔴 높음 |

**실제 DashboardSummary (단순화됨):**
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
  // 상세 분석, 트렌드 등은 미구현
}
```

#### 4. 파일명 및 API 엔드포인트 변경

| 구분 | 가이드 | 실제 구현 | 영향도 |
|------|-------|----------|--------|
| 파일명 | `customer-feedback.*` | `feedback.*` | 🟡 중간 |
| API 답변 | `PATCH /api/feedbacks/:id/respond` | `/api/v1/feedbacks/:id/reply` | 🟡 중간 |
| API 상태 | `PATCH /api/feedbacks/:id` | `/api/v1/feedbacks/:id/status` | 🟡 중간 |

### 📁 생성된 파일 목록

**Backend (11개 파일)**:
```
backend/src/
├── services/
│   ├── feedback.service.ts (VOC + 이미지) ✅
│   ├── attendance.service.ts ✅
│   └── dashboard.service.ts (기본만) ✅
├── controllers/
│   ├── feedback.controller.ts ✅
│   ├── attendance.controller.ts ✅
│   └── dashboard.controller.ts ✅
├── routes/
│   ├── feedback.routes.ts ✅
│   ├── attendance.routes.ts ✅
│   └── dashboard.routes.ts ✅
└── validators/
    ├── feedback.validator.ts ✅
    └── attendance.validator.ts ✅

backend/prisma/
└── schema.prisma (CustomerFeedback, FeedbackImage, Attendance, AttendanceSetting) ✅
```

**미생성 파일 (가이드에는 있으나 실제로는 없음)**:
- `utils/notification.util.ts` (Phase 5 예정)
- `utils/statistics.util.ts` (Service에 inline)
- `types/feedback.types.ts` (Service에 inline)
- `types/attendance.types.ts` (Service에 inline)
- `types/dashboard.types.ts` (Service에 inline)

### 💡 주요 설계 결정 사항

1. **VOC 이미지 첨부**: 증빙 자료 필요성으로 FeedbackImage 모델 추가 (가이드에 없음)
2. **Attendance Status Enum**: Boolean 필드 대신 단일 상태로 통합 (쿼리 최적화)
3. **AttendanceSetting 분리**: 사업장별 다양한 설정 지원, 이력 관리 가능
4. **파일명 간소화**: customer-feedback → feedback (명확성)
5. **Dashboard 단순화**: 핵심 통계만 구현, 상세 분석은 추후 확장
6. **알림 시스템 연기**: FCM 연동은 Phase 5로 연기

### 📝 참고 문서

- **Phase3_실제구현_vs_가이드_차이점.md**: 상세한 차이점 분석 문서
- **backend/prisma/schema.prisma**: 실제 데이터 모델 정의
- **backend/src/services/\*.service.ts**: 실제 비즈니스 로직 구현

### 🎯 다음 작업

Phase 4 (웹 프론트엔드) 진행 전에:
1. ✅ Phase 3 가이드를 실제 구현에 맞춰 업데이트 완료
2. ✅ 구현_가이드_목차.md 업데이트 필요
3. ⏭️ Phase 4, 5, 6 가이드도 실제 구현 기준으로 검토 필요
