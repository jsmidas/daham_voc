/**
 * Site API
 * @description 사업장 관련 API 호출 함수
 */

import { apiClient } from '@/utils/axios';

// 사업장 목록 조회
export async function getSites(params?: any) {
  return apiClient.get('/sites', { params });
}

// 사업장 상세 조회
export async function getSiteById(id: string) {
  return apiClient.get(`/sites/${id}`);
}

// 사업장 생성
export async function createSite(data: any) {
  return apiClient.post('/sites', data);
}

// 사업장 수정
export async function updateSite(id: string, data: any) {
  return apiClient.put(`/sites/${id}`, data);
}

// 사업장 삭제
export async function deleteSite(id: string) {
  return apiClient.delete(`/sites/${id}`);
}

// 사업장 그룹 목록 조회
export async function getSiteGroups() {
  return apiClient.get('/site-groups');
}

// 사업장 그룹 생성
export async function createSiteGroup(data: any) {
  return apiClient.post('/site-groups', data);
}
