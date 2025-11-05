/**
 * Staff API
 * @description 담당자 관리 API 클라이언트
 */

import apiClient from '@/utils/apiClient';

// Types
export type Division = 'HQ' | 'YEONGNAM';
export type Role =
  | 'SUPER_ADMIN'
  | 'HQ_ADMIN'
  | 'YEONGNAM_ADMIN'
  | 'GROUP_MANAGER'
  | 'SITE_MANAGER'
  | 'SITE_STAFF'
  | 'DELIVERY_DRIVER'
  | 'CLIENT';

export interface Staff {
  id: string;
  userId: string;
  employeeNo: string;
  department?: string;
  position?: string;
  managerId?: string;
  averageRating: number;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
  user: {
    id: string;
    name: string;
    email?: string;
    phone: string;
    role: Role;
    division?: Division;
    isActive: boolean;
    lastLoginAt?: string;
  };
  manager?: {
    id: string;
    employeeNo: string;
    user: {
      name: string;
      phone: string;
    };
  };
  staffSites?: {
    id: string;
    staffId: string;
    siteId: string;
    isPrimary: boolean;
    assignedAt: string;
    removedAt?: string;
    site: {
      id: string;
      name: string;
      type: string;
      division: Division;
      address?: string;
    };
  }[];
}

export interface StaffListResponse {
  items: Staff[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface CreateStaffData {
  // User 정보
  name: string;
  phone: string;
  email?: string;
  password: string;
  role: Role;
  division?: Division;
  canUseAttendance?: boolean;
  // Staff 정보
  employeeNo?: string;
  department?: string;
  position?: string;
  managerId?: string;
  // 사업장 배정
  siteIds?: string[];
  siteGroupIds?: string[];
}

export interface UpdateStaffData {
  // User 정보
  name?: string;
  phone?: string;
  email?: string;
  role?: Role;
  division?: Division;
  isActive?: boolean;
  // Staff 정보
  department?: string;
  position?: string;
  managerId?: string;
}

/**
 * 담당자 목록 조회
 */
export async function getStaffList(params?: {
  page?: number;
  limit?: number;
  division?: Division;
  role?: Role;
  search?: string;
  department?: string;
}) {
  const response = await apiClient.get<{ data: StaffListResponse }>('/staff', {
    params,
  });
  return response.data.data;
}

/**
 * 담당자 상세 조회
 */
export async function getStaffById(id: string) {
  const response = await apiClient.get<{ data: Staff }>(`/staff/${id}`);
  return response.data.data;
}

/**
 * 담당자 생성
 */
export async function createStaff(data: CreateStaffData) {
  const response = await apiClient.post<{ data: Staff }>('/staff', data);
  return response.data.data;
}

/**
 * 담당자 수정
 */
export async function updateStaff(id: string, data: UpdateStaffData) {
  const response = await apiClient.patch<{ data: Staff }>(`/staff/${id}`, data);
  return response.data.data;
}

/**
 * 담당자 삭제
 */
export async function deleteStaff(id: string) {
  const response = await apiClient.delete<{ data: { message: string } }>(`/staff/${id}`);
  return response.data.data;
}

/**
 * 담당자 사업장 및 그룹 배정
 */
export async function assignStaffToSites(id: string, siteIds: string[], siteGroupIds: string[] = []) {
  const response = await apiClient.post<{ data: { message: string } }>(
    `/staff/${id}/sites`,
    { siteIds, siteGroupIds }
  );
  return response.data.data;
}

/**
 * 비밀번호 초기화
 */
export async function resetStaffPassword(id: string, newPassword: string) {
  const response = await apiClient.post<{ data: { message: string } }>(
    `/staff/${id}/reset-password`,
    { newPassword }
  );
  return response.data.data;
}
