/**
 * Notice API
 * @description 공지 관련 API 호출 함수
 */

import { apiClient } from '@/utils/axios';

export type NoticeTarget = 'ALL' | 'DIVISION' | 'ROLE' | 'USER';
export type Division = 'HQ' | 'YEONGNAM' | 'CONSIGNMENT';
export type Role =
  | 'SUPER_ADMIN'
  | 'HQ_ADMIN'
  | 'YEONGNAM_ADMIN'
  | 'GROUP_MANAGER'
  | 'SITE_MANAGER'
  | 'SITE_STAFF'
  | 'DELIVERY_DRIVER'
  | 'CLIENT'
  | 'CUSTOMER';

export interface Notice {
  id: string;
  title: string;
  content: string;
  targetType: NoticeTarget;
  targetDivisions: Division[];
  targetRoles: Role[];
  targetUserIds: string[];
  isPinned: boolean;
  publishedAt: string | null;
  expiresAt: string | null;
  authorId: string;
  createdAt: string;
  updatedAt: string;
  author?: { id: string; name: string; role: Role };
  isRead?: boolean;
  _count?: { reads: number };
}

export interface NoticeListResponse {
  success: boolean;
  data: Notice[];
  meta?: { page: number; limit: number; total: number; totalPages: number };
}

export interface NoticeUpsertInput {
  title: string;
  content: string;
  targetType: NoticeTarget;
  targetDivisions?: Division[];
  targetRoles?: Role[];
  targetUserIds?: string[];
  isPinned?: boolean;
  publishedAt?: string | null;
  expiresAt?: string | null;
  sendPush?: boolean;
}

export async function getMyNotices(params?: { page?: number; limit?: number; search?: string }) {
  return apiClient.get('/notices', { params }) as Promise<NoticeListResponse>;
}

export async function getAdminNotices(params?: {
  page?: number;
  limit?: number;
  targetType?: NoticeTarget;
  search?: string;
}) {
  return apiClient.get('/notices/admin', { params }) as Promise<NoticeListResponse>;
}

export async function getUnreadCount() {
  return apiClient.get('/notices/unread-count') as Promise<{
    success: boolean;
    data: { count: number };
  }>;
}

export async function getNoticeById(id: string, markRead = false) {
  return apiClient.get(`/notices/${id}`, { params: { markRead } }) as Promise<{
    success: boolean;
    data: Notice;
  }>;
}

export async function createNotice(data: NoticeUpsertInput) {
  return apiClient.post('/notices', data) as Promise<{ success: boolean; data: Notice }>;
}

export async function updateNotice(id: string, data: Partial<NoticeUpsertInput>) {
  return apiClient.patch(`/notices/${id}`, data) as Promise<{ success: boolean; data: Notice }>;
}

export async function deleteNotice(id: string) {
  return apiClient.delete(`/notices/${id}`);
}
