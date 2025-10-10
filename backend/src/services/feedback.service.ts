/**
 * Feedback Service
 * @description 고객 피드백(VOC) CRUD 및 비즈니스 로직
 */

import { prisma } from '../config/database';
import { cache } from '../config/redis';
import { FeedbackAuthorType, FeedbackStatus } from '@prisma/client';

export interface CreateFeedbackDto {
  siteId: string;
  authorType: FeedbackAuthorType;
  content: string;
  rating?: number;
}

export interface UpdateFeedbackDto {
  content?: string;
  rating?: number;
  status?: FeedbackStatus;
}

export interface ReplyFeedbackDto {
  adminReply: string;
}

export interface FeedbackFilter {
  siteId?: string;
  siteIds?: string[];
  authorId?: string;
  authorType?: FeedbackAuthorType;
  status?: FeedbackStatus;
  dateFrom?: Date;
  dateTo?: Date;
  minRating?: number;
  maxRating?: number;
}

/**
 * 피드백 생성
 */
export async function createFeedback(
  dto: CreateFeedbackDto,
  userId: string
): Promise<any> {
  // 사업장 존재 확인
  const site = await prisma.site.findUnique({
    where: { id: dto.siteId },
  });

  if (!site) {
    throw new Error('Site not found');
  }

  // Rating 검증 (1-5)
  if (dto.rating !== undefined && (dto.rating < 1 || dto.rating > 5)) {
    throw new Error('Rating must be between 1 and 5');
  }

  // DB 저장
  const feedback = await prisma.customerFeedback.create({
    data: {
      siteId: dto.siteId,
      authorId: userId,
      authorType: dto.authorType,
      content: dto.content,
      rating: dto.rating,
      status: 'PENDING',
    },
    include: {
      site: {
        select: { id: true, name: true, type: true },
      },
      author: {
        select: { id: true, name: true, email: true, role: true },
      },
    },
  });

  // 캐시 무효화
  await invalidateFeedbackCache(dto.siteId);

  return feedback;
}

/**
 * 피드백 목록 조회
 */
export async function getFeedbacks(filter: FeedbackFilter): Promise<any[]> {
  // 캐시 키 생성
  const cacheKey = `feedbacks:${JSON.stringify(filter)}`;

  // Redis 캐시 확인
  const cached = await cache.get(cacheKey);
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

  if (filter.siteIds && filter.siteIds.length > 0) {
    where.siteId = { in: filter.siteIds };
  }

  if (filter.authorId) {
    where.authorId = filter.authorId;
  }

  if (filter.authorType) {
    where.authorType = filter.authorType;
  }

  if (filter.status) {
    where.status = filter.status;
  }

  if (filter.dateFrom || filter.dateTo) {
    where.createdAt = {};
    if (filter.dateFrom) where.createdAt.gte = filter.dateFrom;
    if (filter.dateTo) where.createdAt.lte = filter.dateTo;
  }

  if (filter.minRating !== undefined || filter.maxRating !== undefined) {
    where.rating = {};
    if (filter.minRating !== undefined) where.rating.gte = filter.minRating;
    if (filter.maxRating !== undefined) where.rating.lte = filter.maxRating;
  }

  // 조회
  const feedbacks = await prisma.customerFeedback.findMany({
    where,
    include: {
      site: {
        select: { id: true, name: true, type: true },
      },
      author: {
        select: { id: true, name: true, email: true, role: true },
      },
    },
    orderBy: [{ createdAt: 'desc' }],
  });

  // 캐시 저장 (10분)
  await cache.set(cacheKey, JSON.stringify(feedbacks), 600);

  return feedbacks;
}

/**
 * 피드백 상세 조회
 */
export async function getFeedbackById(id: string): Promise<any> {
  const feedback = await prisma.customerFeedback.findUnique({
    where: { id },
    include: {
      site: {
        select: { id: true, name: true, type: true, division: true },
      },
      author: {
        select: { id: true, name: true, email: true, role: true },
      },
    },
  });

  if (!feedback || feedback.deletedAt) {
    throw new Error('Feedback not found');
  }

  return feedback;
}

/**
 * 피드백 수정 (작성자만 가능)
 */
export async function updateFeedback(
  feedbackId: string,
  dto: UpdateFeedbackDto,
  userId: string
): Promise<any> {
  // 기존 피드백 조회
  const feedback = await prisma.customerFeedback.findUnique({
    where: { id: feedbackId },
  });

  if (!feedback || feedback.deletedAt) {
    throw new Error('Feedback not found');
  }

  // 작성자 확인
  if (feedback.authorId !== userId) {
    throw new Error('Only the author can update this feedback');
  }

  // Rating 검증
  if (dto.rating !== undefined && (dto.rating < 1 || dto.rating > 5)) {
    throw new Error('Rating must be between 1 and 5');
  }

  // 업데이트 데이터 준비
  const updateData: any = {};

  if (dto.content !== undefined) updateData.content = dto.content;
  if (dto.rating !== undefined) updateData.rating = dto.rating;
  if (dto.status !== undefined) updateData.status = dto.status;

  // DB 업데이트
  const updated = await prisma.customerFeedback.update({
    where: { id: feedbackId },
    data: updateData,
    include: {
      site: {
        select: { id: true, name: true, type: true },
      },
      author: {
        select: { id: true, name: true, email: true, role: true },
      },
    },
  });

  // 캐시 무효화
  await invalidateFeedbackCache(feedback.siteId);

  return updated;
}

/**
 * 피드백 삭제 (Soft Delete)
 */
export async function deleteFeedback(feedbackId: string, userId: string): Promise<void> {
  const feedback = await prisma.customerFeedback.findUnique({
    where: { id: feedbackId },
  });

  if (!feedback || feedback.deletedAt) {
    throw new Error('Feedback not found');
  }

  // 작성자 확인 (관리자는 모든 피드백 삭제 가능하도록 서비스에서 체크하지 않음)
  if (feedback.authorId !== userId) {
    // 관리자 권한은 컨트롤러/미들웨어에서 체크
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || !['SUPER_ADMIN', 'HQ_ADMIN', 'YEONGNAM_ADMIN'].includes(user.role)) {
      throw new Error('Only the author or admin can delete this feedback');
    }
  }

  // Soft Delete
  await prisma.customerFeedback.update({
    where: { id: feedbackId },
    data: { deletedAt: new Date() },
  });

  // 캐시 무효화
  await invalidateFeedbackCache(feedback.siteId);
}

/**
 * 관리자 답변
 */
export async function replyToFeedback(
  feedbackId: string,
  dto: ReplyFeedbackDto,
  userId: string
): Promise<any> {
  const feedback = await prisma.customerFeedback.findUnique({
    where: { id: feedbackId },
  });

  if (!feedback || feedback.deletedAt) {
    throw new Error('Feedback not found');
  }

  // 관리자 권한 확인
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || !['SUPER_ADMIN', 'HQ_ADMIN', 'YEONGNAM_ADMIN'].includes(user.role)) {
    throw new Error('Only administrators can reply to feedback');
  }

  // 답변 저장 및 상태 변경
  const updated = await prisma.customerFeedback.update({
    where: { id: feedbackId },
    data: {
      adminReply: dto.adminReply,
      repliedAt: new Date(),
      repliedBy: userId,
      status: 'RESOLVED', // 답변 시 자동으로 RESOLVED 상태로 변경
    },
    include: {
      site: {
        select: { id: true, name: true, type: true },
      },
      author: {
        select: { id: true, name: true, email: true, role: true },
      },
    },
  });

  // 캐시 무효화
  await invalidateFeedbackCache(feedback.siteId);

  return updated;
}

/**
 * 피드백 상태 변경
 */
export async function updateFeedbackStatus(
  feedbackId: string,
  status: FeedbackStatus,
  userId: string
): Promise<any> {
  const feedback = await prisma.customerFeedback.findUnique({
    where: { id: feedbackId },
  });

  if (!feedback || feedback.deletedAt) {
    throw new Error('Feedback not found');
  }

  // 관리자 권한 확인
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || !['SUPER_ADMIN', 'HQ_ADMIN', 'YEONGNAM_ADMIN'].includes(user.role)) {
    throw new Error('Only administrators can change feedback status');
  }

  const updated = await prisma.customerFeedback.update({
    where: { id: feedbackId },
    data: { status },
    include: {
      site: {
        select: { id: true, name: true, type: true },
      },
      author: {
        select: { id: true, name: true, email: true, role: true },
      },
    },
  });

  // 캐시 무효화
  await invalidateFeedbackCache(feedback.siteId);

  return updated;
}

/**
 * 캐시 무효화
 */
async function invalidateFeedbackCache(siteId: string): Promise<void> {
  const keys = await cache.keys(`feedbacks:*${siteId}*`);
  if (keys.length > 0) {
    await cache.del(...keys);
  }
}

/**
 * 피드백 통계
 */
export async function getFeedbackStatistics(
  siteId: string,
  dateFrom: Date,
  dateTo: Date
): Promise<any> {
  const feedbacks = await prisma.customerFeedback.findMany({
    where: {
      siteId,
      createdAt: {
        gte: dateFrom,
        lte: dateTo,
      },
      deletedAt: null,
    },
    select: {
      status: true,
      rating: true,
      authorType: true,
    },
  });

  // 통계 집계
  const stats = {
    total: feedbacks.length,
    byStatus: {} as Record<string, number>,
    byAuthorType: {} as Record<string, number>,
    averageRating: 0,
    ratingDistribution: {} as Record<number, number>,
  };

  let totalRating = 0;
  let ratingCount = 0;

  feedbacks.forEach((feedback) => {
    // Status 집계
    stats.byStatus[feedback.status] = (stats.byStatus[feedback.status] || 0) + 1;

    // AuthorType 집계
    stats.byAuthorType[feedback.authorType] = (stats.byAuthorType[feedback.authorType] || 0) + 1;

    // Rating 집계
    if (feedback.rating !== null && feedback.rating !== undefined) {
      totalRating += feedback.rating;
      ratingCount++;
      stats.ratingDistribution[feedback.rating] = (stats.ratingDistribution[feedback.rating] || 0) + 1;
    }
  });

  // 평균 Rating 계산
  stats.averageRating = ratingCount > 0 ? Math.round((totalRating / ratingCount) * 100) / 100 : 0;

  return stats;
}

/**
 * 사업장별 최근 피드백 조회
 */
export async function getRecentFeedbacks(
  siteId: string,
  limit: number = 10
): Promise<any[]> {
  return prisma.customerFeedback.findMany({
    where: {
      siteId,
      deletedAt: null,
    },
    include: {
      site: {
        select: { id: true, name: true, type: true },
      },
      author: {
        select: { id: true, name: true, email: true, role: true },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
}
