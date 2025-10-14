/**
 * Dashboard API
 * @description 대시보드 관련 API 호출 함수
 */

import { apiClient } from '@/utils/axios';

// 대시보드 요약 조회
export async function getDashboardSummary(dateFrom: string, dateTo: string) {
  return apiClient.get('/dashboard/summary', {
    params: { dateFrom, dateTo },
  });
}

// 사업장별 상세 통계
export async function getSiteDetailStats(
  siteId: string,
  dateFrom: string,
  dateTo: string
) {
  return apiClient.get(`/dashboard/site/${siteId}`, {
    params: { dateFrom, dateTo },
  });
}

// 담당자 실적
export async function getStaffPerformance(
  userId: string,
  dateFrom: string,
  dateTo: string
) {
  return apiClient.get(`/dashboard/staff/${userId}`, {
    params: { dateFrom, dateTo },
  });
}

// 부문별 비교
export async function getDivisionComparison(dateFrom: string, dateTo: string) {
  return apiClient.get('/dashboard/division-comparison', {
    params: { dateFrom, dateTo },
  });
}

// 일별 VOC 트렌드
export async function getDailyVOCTrend(dateFrom: string, dateTo: string) {
  return apiClient.get('/dashboard/daily-voc-trend', {
    params: { dateFrom, dateTo },
  });
}

// 사업장별 비교 통계
export async function getSiteComparison(dateFrom: string, dateTo: string) {
  return apiClient.get('/dashboard/site-comparison', {
    params: { dateFrom, dateTo },
  });
}

// 담당자별 평점 통계
export async function getStaffPerformanceStats(dateFrom: string, dateTo: string) {
  return apiClient.get('/dashboard/staff-performance', {
    params: { dateFrom, dateTo },
  });
}
