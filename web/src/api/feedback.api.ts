/**
 * Feedback API
 * @description VOC(고객 피드백) 관련 API 호출 함수
 */

import { apiClient } from '@/utils/axios';

// VOC 목록 조회
export async function getFeedbacks(params?: any) {
  return apiClient.get('/feedbacks', { params });
}

// VOC 상세 조회
export async function getFeedbackById(id: string) {
  return apiClient.get(`/feedbacks/${id}`);
}

// VOC 답변 (관리자)
export async function replyToFeedback(id: string, data: { adminReply: string }) {
  return apiClient.post(`/feedbacks/${id}/reply`, data);
}

// VOC 생성 (이미지 최대 6개 업로드 지원)
export async function createFeedback(data: {
  siteId: string;
  authorType: string;
  content: string;
  rating?: number;
  images?: File[];  // 최대 6개
}) {
  const formData = new FormData();
  formData.append('siteId', data.siteId);
  formData.append('authorType', data.authorType);
  formData.append('content', data.content);
  if (data.rating) {
    formData.append('rating', data.rating.toString());
  }

  // 이미지 파일 추가 (최대 6개)
  if (data.images && data.images.length > 0) {
    data.images.forEach((file) => {
      formData.append('images', file);
    });
  }

  return apiClient.post('/feedbacks', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
}

// VOC 상태 변경
export async function updateFeedbackStatus(id: string, data: { status: string }) {
  return apiClient.patch(`/feedbacks/${id}/status`, data);
}
