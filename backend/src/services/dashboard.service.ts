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

/**
 * 일별 VOC 트렌드
 */
export async function getDailyVOCTrend(
  dateFrom: Date,
  dateTo: Date
): Promise<Array<{ date: string; count: number; avgRating: number }>> {
  const cacheKey = `dashboard:daily-voc:${dateFrom.toISOString()}:${dateTo.toISOString()}`;

  const cached = await cache.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }

  const feedbacks = await prisma.customerFeedback.findMany({
    where: {
      deletedAt: null,
      createdAt: {
        gte: dateFrom,
        lte: dateTo,
      },
    },
    select: {
      createdAt: true,
      rating: true,
    },
    orderBy: {
      createdAt: 'asc',
    },
  });

  // 날짜별 그룹화
  const dailyMap: { [date: string]: { count: number; ratings: number[] } } = {};

  feedbacks.forEach((f) => {
    const date = f.createdAt.toISOString().split('T')[0];
    if (!dailyMap[date]) {
      dailyMap[date] = { count: 0, ratings: [] };
    }
    dailyMap[date].count++;
    if (f.rating) {
      dailyMap[date].ratings.push(f.rating);
    }
  });

  // 결과 생성
  const result = Object.keys(dailyMap).map((date) => ({
    date,
    count: dailyMap[date].count,
    avgRating:
      dailyMap[date].ratings.length > 0
        ? Math.round(
            (dailyMap[date].ratings.reduce((a, b) => a + b, 0) /
              dailyMap[date].ratings.length) *
              10
          ) / 10
        : 0,
  }));

  await cache.set(cacheKey, JSON.stringify(result), 600);

  return result;
}

/**
 * 사업장별 비교 통계
 */
export async function getSiteComparison(
  dateFrom: Date,
  dateTo: Date
): Promise<
  Array<{
    siteId: string;
    siteName: string;
    feedbackCount: number;
    avgRating: number;
    attendanceCount: number;
  }>
> {
  const cacheKey = `dashboard:site-comparison:${dateFrom.toISOString()}:${dateTo.toISOString()}`;

  const cached = await cache.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }

  const sites = await prisma.site.findMany({
    where: {
      deletedAt: null,
      isActive: true,
    },
    select: {
      id: true,
      name: true,
    },
  });

  const result = await Promise.all(
    sites.map(async (site) => {
      // VOC 통계
      const feedbacks = await prisma.customerFeedback.findMany({
        where: {
          siteId: site.id,
          deletedAt: null,
          createdAt: {
            gte: dateFrom,
            lte: dateTo,
          },
        },
        select: {
          rating: true,
        },
      });

      const feedbackCount = feedbacks.length;
      const avgRating =
        feedbackCount > 0
          ? Math.round(
              (feedbacks.reduce((sum, f) => sum + (f.rating || 0), 0) /
                feedbackCount) *
                10
            ) / 10
          : 0;

      // 출퇴근 통계
      const attendanceCount = await prisma.attendance.count({
        where: {
          siteId: site.id,
          deletedAt: null,
          checkInTime: {
            gte: dateFrom,
            lte: dateTo,
          },
        },
      });

      return {
        siteId: site.id,
        siteName: site.name,
        feedbackCount,
        avgRating,
        attendanceCount,
      };
    })
  );

  await cache.set(cacheKey, JSON.stringify(result), 600);

  return result;
}

/**
 * 담당자별 평점 통계
 */
export async function getStaffPerformance(
  dateFrom: Date,
  dateTo: Date
): Promise<
  Array<{
    userId: string;
    userName: string;
    feedbackCount: number;
    avgRating: number;
  }>
> {
  const cacheKey = `dashboard:staff-performance:${dateFrom.toISOString()}:${dateTo.toISOString()}`;

  const cached = await cache.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }

  const feedbacks = await prisma.customerFeedback.findMany({
    where: {
      deletedAt: null,
      createdAt: {
        gte: dateFrom,
        lte: dateTo,
      },
    },
    select: {
      author: {
        select: {
          id: true,
          name: true,
        },
      },
      rating: true,
    },
  });

  // 담당자별 그룹화
  const staffMap: {
    [userId: string]: {
      userName: string;
      ratings: number[];
    };
  } = {};

  feedbacks.forEach((f) => {
    const userId = f.author.id;
    if (!staffMap[userId]) {
      staffMap[userId] = {
        userName: f.author.name,
        ratings: [],
      };
    }
    if (f.rating) {
      staffMap[userId].ratings.push(f.rating);
    }
  });

  // 결과 생성
  const result = Object.keys(staffMap).map((userId) => ({
    userId,
    userName: staffMap[userId].userName,
    feedbackCount: staffMap[userId].ratings.length,
    avgRating:
      staffMap[userId].ratings.length > 0
        ? Math.round(
            (staffMap[userId].ratings.reduce((a, b) => a + b, 0) /
              staffMap[userId].ratings.length) *
              10
          ) / 10
        : 0,
  }));

  await cache.set(cacheKey, JSON.stringify(result), 600);

  return result;
}
