/**
 * Meal Photo API
 * @description 배식사진 관리 API
 */

import apiClient from '@/utils/apiClient';

export interface BulkUploadMealPhotoDto {
  siteId: string;
  mealType?: 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SUPPER';
  photoType: 'SERVING' | 'LEFTOVER' | 'FACILITY';
  capturedAt: string; // ISO date string
  photos: File[];
  latitude?: number;
  longitude?: number;
}

export interface MealPhotoFilter {
  siteId?: string;
  siteIds?: string;
  uploaderId?: string;
  photoType?: 'SERVING' | 'LEFTOVER' | 'FACILITY';
  mealType?: 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SUPPER';
  dateFrom?: string;
  dateTo?: string;
}

/**
 * 배식사진 목록 조회
 */
export async function getMealPhotos(filter?: MealPhotoFilter) {
  const params = new URLSearchParams();
  if (filter?.siteId) params.append('siteId', filter.siteId);
  if (filter?.siteIds) params.append('siteIds', filter.siteIds);
  if (filter?.uploaderId) params.append('uploaderId', filter.uploaderId);
  if (filter?.photoType) params.append('photoType', filter.photoType);
  if (filter?.mealType) params.append('mealType', filter.mealType);
  if (filter?.dateFrom) params.append('dateFrom', filter.dateFrom);
  if (filter?.dateTo) params.append('dateTo', filter.dateTo);

  const response = await apiClient.get(`/meal-photos?${params.toString()}`);
  return response.data;
}

/**
 * 일간 배식사진 조회
 */
export async function getDailyMealPhotos(siteId: string, date: string) {
  const response = await apiClient.get('/meal-photos/daily', {
    params: { siteId, date },
  });
  return response.data;
}

/**
 * 배식사진 일괄 업로드 (최대 6개)
 */
export async function bulkUploadMealPhotos(dto: BulkUploadMealPhotoDto) {
  const formData = new FormData();
  formData.append('siteId', dto.siteId);
  formData.append('photoType', dto.photoType);
  formData.append('capturedAt', dto.capturedAt);

  if (dto.mealType) {
    formData.append('mealType', dto.mealType);
  }

  if (dto.latitude !== undefined) {
    formData.append('latitude', dto.latitude.toString());
  }

  if (dto.longitude !== undefined) {
    formData.append('longitude', dto.longitude.toString());
  }

  // 여러 이미지 추가
  dto.photos.forEach((photo) => {
    formData.append('photos', photo);
  });

  const response = await apiClient.post('/meal-photos/bulk', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data;
}

/**
 * 배식사진 삭제
 */
export async function deleteMealPhoto(id: string) {
  const response = await apiClient.delete(`/meal-photos/${id}`);
  return response.data;
}
