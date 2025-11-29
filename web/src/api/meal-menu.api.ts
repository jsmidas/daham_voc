/**
 * Meal Menu API
 * @description 식수 메뉴 관리 API
 */

import { apiClient } from '@/utils/axios';

export interface MealMenu {
  id: string;
  name: string;
  description?: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * 전체 메뉴 목록 조회
 */
export async function getMealMenus(includeInactive = false) {
  const response = await apiClient.get('/meal-menus', {
    params: { includeInactive },
  });
  return response.data;
}

/**
 * 메뉴 단일 조회
 */
export async function getMealMenuById(id: string) {
  const response = await apiClient.get(`/meal-menus/${id}`);
  return response.data;
}

/**
 * 메뉴 생성
 */
export async function createMealMenu(data: {
  name: string;
  description?: string;
  sortOrder?: number;
  isActive?: boolean;
}) {
  const response = await apiClient.post('/meal-menus', data);
  return response.data;
}

/**
 * 메뉴 수정
 */
export async function updateMealMenu(
  id: string,
  data: {
    name?: string;
    description?: string;
    sortOrder?: number;
    isActive?: boolean;
  }
) {
  const response = await apiClient.put(`/meal-menus/${id}`, data);
  return response.data;
}

/**
 * 메뉴 삭제
 */
export async function deleteMealMenu(id: string) {
  const response = await apiClient.delete(`/meal-menus/${id}`);
  return response.data;
}

/**
 * 사업장에 할당된 메뉴 목록 조회
 */
export async function getSiteMealMenus(siteId: string) {
  const response = await apiClient.get(`/meal-menus/site/${siteId}`);
  return response.data;
}

/**
 * 사업장에 메뉴 할당
 */
export async function assignMealMenusToSite(siteId: string, mealMenuIds: string[]) {
  const response = await apiClient.post(`/meal-menus/site/${siteId}`, {
    mealMenuIds,
  });
  return response.data;
}
