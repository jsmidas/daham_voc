/**
 * Meal Count API
 * @description 식수 인원 관리 API 호출 함수
 */

import { apiClient } from '@/utils/axios';

// Meal type enum
export type MealType = 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SUPPER';

// Meal count setting interface
export interface MealCountSetting {
  id: string;
  siteId: string;
  deadlineHoursBefore: number;
  breakfastStartTime?: string;
  lunchStartTime?: string;
  dinnerStartTime?: string;
  lunchMenuCount: number;
  lunchMenu1Name?: string;
  lunchMenu2Name?: string;
  lunchMenu3Name?: string;
  allowLateSubmission: boolean;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface MealCount {
  id: string;
  siteId: string;
  date: string;
  mealType: MealType;
  menuNumber: number;
  count: number;
  submittedBy: string;
  submittedAt: string;
  isLate: boolean;
  note?: string;
  site?: {
    id: string;
    name: string;
  };
  submitter?: {
    id: string;
    name: string;
    phone: string;
  };
}

// 사업장 식수 설정 조회
export async function getMealCountSetting(siteId: string) {
  return apiClient.get(`/meal-counts/settings/${siteId}`);
}

// 사업장 식수 설정 생성/수정
export async function upsertMealCountSetting(siteId: string, data: Partial<MealCountSetting>) {
  return apiClient.post(`/meal-counts/settings/${siteId}`, data);
}

// 식수 인원 등록
export async function createMealCount(data: {
  siteId: string;
  date: string;
  mealType: MealType;
  menuNumber?: number;
  count: number;
  note?: string;
}) {
  return apiClient.post('/meal-counts', data);
}

// 식수 인원 수정
export async function updateMealCount(id: string, data: {
  count?: number;
  note?: string;
}) {
  return apiClient.put(`/meal-counts/${id}`, data);
}

// 식수 인원 삭제
export async function deleteMealCount(id: string) {
  return apiClient.delete(`/meal-counts/${id}`);
}

// 사업장 날짜별 식수 인원 조회
export async function getMealCountsByDate(siteId: string, date: string) {
  return apiClient.get(`/meal-counts/site/${siteId}/date/${date}`);
}

// 사업장 기간별 식수 인원 조회
export async function getMealCountsByRange(
  siteId: string,
  startDate: string,
  endDate: string
) {
  return apiClient.get(`/meal-counts/site/${siteId}/range`, {
    params: { startDate, endDate },
  });
}
