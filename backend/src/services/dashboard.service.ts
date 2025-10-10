/**
 * Dashboard Service
 * @description 대시보드 통계 비즈니스 로직
 */

import { prisma } from '../config/database';
import { cache } from '../config/redis';

export interface DashboardSummary {
  totalSites: number;
  totalFeedbacks: number;
  pendingFeedbacks: number;
  resolvedFeedbacks: number;
  avgRating: number;
  totalAttendances: number;
  normalAttendances: number;
  lateAttendances: number;
}

/**
 * 대시보드 요약 통계
 */
export async function getDashboardSummary(
  dateFrom: Date,
  dateTo: Date
): Promise<DashboardSummary> {
  // 캐시 키 생성
  const cacheKey = `dashboard:summary:${dateFrom.toISOString()}:${dateTo.toISOString()}`;

  // Redis 캐시 확인
  const cached = await cache.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }

  // 사업장 수
  const totalSites = await prisma.site.count({
    where: { deletedAt: null, isActive: true },
  });

  // 피드백 통계
  const feedbacks = await prisma.customerFeedback.findMany({
    where: {
      deletedAt: null,
      createdAt: {
        gte: dateFrom,
        lte: dateTo,
      },
    },
    select: {
      status: true,
      rating: true,
    },
  });

  const totalFeedbacks = feedbacks.length;
  const pendingFeedbacks = feedbacks.filter(
    (f) => f.status === 'PENDING'
  ).length;
  const resolvedFeedbacks = feedbacks.filter(
    (f) => f.status === 'RESOLVED'
  ).length;

  // 평균 별점 계산
  const ratingsSum = feedbacks.reduce(
    (sum, f) => sum + (f.rating || 0),
    0
  );
  const avgRating = totalFeedbacks > 0 ? ratingsSum / totalFeedbacks : 0;

  // 출퇴근 통계
  const attendances = await prisma.attendance.findMany({
    where: {
      deletedAt: null,
      checkInTime: {
        gte: dateFrom,
        lte: dateTo,
      },
    },
    select: {
      status: true,
    },
  });

  const totalAttendances = attendances.length;
  const normalAttendances = attendances.filter(
    (a) => a.status === 'NORMAL'
  ).length;
  const lateAttendances = attendances.filter((a) => a.status === 'LATE').length;

  const summary: DashboardSummary = {
    totalSites,
    totalFeedbacks,
    pendingFeedbacks,
    resolvedFeedbacks,
    avgRating: Math.round(avgRating * 10) / 10,
    totalAttendances,
    normalAttendances,
    lateAttendances,
  };

  // 캐시 저장 (10분)
  await cache.set(cacheKey, JSON.stringify(summary), 600);

  return summary;
}
