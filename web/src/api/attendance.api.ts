/**
 * Attendance API
 * @description 출퇴근 관리 API
 */

import { apiClient } from '@/utils/axios';

export interface Attendance {
  id: string;
  userId: string;
  siteId: string;
  checkInTime: string;
  checkOutTime?: string;
  checkInLat: number;
  checkInLng: number;
  checkOutLat?: number;
  checkOutLng?: number;
  status: 'NORMAL' | 'LATE' | 'EARLY_LEAVE' | 'OUTSIDE_RANGE' | 'ABSENT';
  note?: string;
  user: {
    id: string;
    name: string;
    email?: string;
    role: string;
  };
  site: {
    id: string;
    name: string;
    type: string;
  };
  createdAt: string;
}

export interface AttendanceFilter {
  siteId?: string;
  siteIds?: string[];
  userId?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface AttendanceSetting {
  id: string;
  siteId: string;
  expectedCheckIn: string;
  expectedCheckOut: string;
  allowedRadius: number;
  isActive: boolean;
  site: {
    id: string;
    name: string;
    type: string;
  };
}

export interface AttendanceStatistics {
  total: number;
  byStatus: Record<string, number>;
  checkedOut: number;
  notCheckedOut: number;
}

/**
 * 출퇴근 목록 조회
 */
export async function getAttendances(filter: AttendanceFilter): Promise<any> {
  const params = new URLSearchParams();

  if (filter.siteId) params.append('siteId', filter.siteId);
  if (filter.siteIds && filter.siteIds.length > 0) {
    params.append('siteIds', filter.siteIds.join(','));
  }
  if (filter.userId) params.append('userId', filter.userId);
  if (filter.status) params.append('status', filter.status);
  if (filter.dateFrom) params.append('dateFrom', filter.dateFrom);
  if (filter.dateTo) params.append('dateTo', filter.dateTo);

  return apiClient.get(`/attendances?${params.toString()}`);
}

/**
 * 출퇴근 상세 조회
 */
export async function getAttendanceById(id: string): Promise<any> {
  return apiClient.get(`/attendances/${id}`);
}

/**
 * 사업장별 출퇴근 통계
 */
export async function getAttendanceStatistics(
  siteId: string,
  dateFrom: string,
  dateTo: string
): Promise<any> {
  return apiClient.get(
    `/attendances/statistics?siteId=${siteId}&dateFrom=${dateFrom}&dateTo=${dateTo}`
  );
}

/**
 * 사용자별 출퇴근 기록
 */
export async function getUserAttendances(
  userId: string,
  dateFrom: string,
  dateTo: string
): Promise<any> {
  return apiClient.get(
    `/attendances/user/${userId}?dateFrom=${dateFrom}&dateTo=${dateTo}`
  );
}

/**
 * 출퇴근 설정 조회
 */
export async function getAttendanceSetting(siteId: string): Promise<any> {
  return apiClient.get(`/attendances/settings/${siteId}`);
}

/**
 * 출퇴근 설정 생성/수정
 */
export async function upsertAttendanceSetting(data: {
  siteId: string;
  expectedCheckIn: string;
  expectedCheckOut: string;
  allowedRadius?: number;
}): Promise<any> {
  return apiClient.post('/attendances/settings', data);
}

/**
 * 출퇴근 정보 수정 (휴게시간 등)
 */
export async function updateAttendance(id: string, data: {
  breakStartTime?: string;
  breakEndTime?: string;
  note?: string;
}): Promise<any> {
  return apiClient.put(`/attendances/${id}`, data);
}
